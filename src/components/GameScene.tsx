import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { useSocket } from "../contexts/SocketContext";
import { useMap } from "../contexts/MapContext";
import { getZoneForPosition } from "../utils/zoneUtils";
import SimplifiedMap from "./SimplifiedMap";
import NotificationPanel from "./NotificationPanel";
import { useNotifications } from "../contexts/NotificationContext";
import { getAllAssets } from "../data/assetManifest";

const GameScene = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { socket, users, currentUser } = useSocket();
  const { mapData } = useMap();
  const [currentZone, setCurrentZone] = useState<{ id: string; name: string } | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [isOverviewMode, setIsOverviewMode] = useState(false);
  const isOverviewModeRef = useRef(false); // Ref for Phaser access
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  // Handle Escape key to close map
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOverviewMode(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    class MainScene extends Phaser.Scene {
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private playerContainer?: Phaser.GameObjects.Container;
      private playerSprite?: Phaser.GameObjects.Sprite;
      private playerNameLabel?: Phaser.GameObjects.Text;
      private otherPlayers: Map<
        string,
        { container: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
      > = new Map();
      private npcs: Phaser.GameObjects.Container[] = [];
      private interactiveObjects: Phaser.GameObjects.Group | null = null;
      private playerPosition = { x: 100, y: 100 };
      private lastSentPosition = { x: 0, y: 0 };
      private moveSpeed = 150;
      private zoneIndicator?: Phaser.GameObjects.Container;
      private zoneText?: Phaser.GameObjects.Text;
      private map?: Phaser.Tilemaps.Tilemap;
      private wallLayer?: Phaser.Tilemaps.TilemapLayer;
      private isSitting = false;
      private wasMoving = false;
      private lastDirection = "down";
      private targetZoom = 1.5;
      private wasd?: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
        E: Phaser.Input.Keyboard.Key;
      };

      constructor() {
        super({ key: "MainScene" });
      }

      preload() {
        const assets = getAllAssets();
        // Load Map and Tileset
        this.load.image("tiles", "/assets/tiles/office.png");
        this.load.tilemapTiledJSON("map", "/assets/map_layered.json");

        // Load Characters
        this.load.spritesheet("player", "/assets/characters/player.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("npc1", "/assets/characters/npc1.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("npc2", "/assets/characters/npc2.png", { frameWidth: 32, frameHeight: 48 });

        // Load Office Objects
        this.load.image("desk", "/assets/objects/Desk_Ornate.png");
        this.load.image("laptop", "/assets/objects/Laptop.png");
        this.load.image("water_cooler", "/assets/objects/Water_Cooler.png");
        this.load.image("coffee_maker", "/assets/objects/Coffee_Maker.png");
        this.load.image("coffee_cup", "/assets/objects/Coffee_Cup.png");
        this.load.image("tv", "/assets/objects/TV_Widescreen.png");
        this.load.image("bin", "/assets/objects/Bins.png");
        this.load.image("card_table", "/assets/objects/Card_Table.png");
        this.load.image("copy_machine", "/assets/objects/Copy_Machine.png");
        this.load.image("sink", "/assets/objects/Sink.png");
        this.load.image("mailboxes", "/assets/objects/Mailboxes.png");
      }

      create() {
        // Create Animations
        this.createAnimations();

        // Create Map
        try {
          this.map = this.make.tilemap({ key: "map" });
          const tileset = this.map.addTilesetImage("office", "tiles");

          if (tileset) {
            this.map.createLayer("Ground", tileset, 0, 0)?.setDepth(0);

            // Background Image (if any)
            // @ts-ignore
            if (mapData?.backgroundImage) {
              // @ts-ignore
              this.load.image("background-custom", mapData.backgroundImage);
              this.load.once("complete", () => {
                // @ts-ignore
                const bg = this.add.image(0, 0, "background-custom").setOrigin(0, 0).setDepth(-1);
                // Optional: Adjust world bounds to image size if needed
                // this.physics.world.setBounds(0, 0, bg.width, bg.height);
              });
              this.load.start();
            }

            // Layer 2: World (Walls, Obstacles) - Depth 10
            this.wallLayer = this.map.createLayer("World", tileset, 0, 0) || undefined;
            if (this.wallLayer) {
              this.wallLayer.setDepth(10);
              this.wallLayer.setCollisionByExclusion([-1]);
            }
            this.map.createLayer("Decoration", tileset, 0, 0)?.setDepth(30);

            this.interactiveObjects = this.physics.add.group();
            const objectLayer = this.map.getObjectLayer("Interactions");
            if (objectLayer && objectLayer.objects) {
              objectLayer.objects.forEach((obj) => {
                const x = obj.x! + obj.width! / 2;
                const y = obj.y! + obj.height! / 2;
                const zone = this.add.zone(x, y, obj.width!, obj.height!);
                this.physics.world.enable(zone);
                (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
                (zone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
                zone.setData("type", obj.type);
                zone.setData("name", obj.name);
                this.interactiveObjects?.add(zone);
              });
            }
          }
        } catch (error) {
          console.error("Error creating map:", error);
        }

        this.createOfficeObjects();
        this.createPlayer();
        this.createNPC(200, 200, "Receptionist");
        this.createNPC(400, 300, "Colleague");

        // Create other players from initial list
        if (users) {
          users.forEach((user) => {
            if (user.userId !== currentUser?.userId) {
              this.createOtherPlayer(user);
            }
          });
        }

        this.cursors = this.input.keyboard?.createCursorKeys();
        this.wasd = {
          W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };

        if (this.playerContainer) {
          this.cameras.main.startFollow(this.playerContainer);
          this.cameras.main.setZoom(1.5);
          this.targetZoom = 1.5;
        }

        this.input.on("wheel", (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
          const currentZoom = this.cameras.main.zoom;
          if (deltaY > 0) {
            if (currentZoom > 1.0) {
              this.targetZoom = Math.max(1.0, currentZoom - 0.1);
            } else {
              setIsOverviewMode(true);
            }
          } else {
            this.targetZoom = Math.min(2.5, currentZoom + 0.1);
            setIsOverviewMode(false);
          }
        });

        this.createZoneIndicator();

        // Socket Listeners
        if (socket) {
          // Listen for individual player movement updates
          socket.on("playerMoved", (data: any) => {
            this.updateOtherPlayer(data.userId, data.position, data.direction);
          });

          // Listen for all players positions (batch update)
          socket.on("allPlayersPositions", (allPlayers: any[]) => {
            allPlayers.forEach((player) => {
              if (player.userId !== currentUser?.userId) {
                if (!this.otherPlayers.has(player.userId)) {
                  // Create player if doesn't exist
                  this.createOtherPlayer(player);
                } else {
                  // Update existing player position
                  this.updateOtherPlayer(player.userId, player.position, player.direction);
                }
              }
            });
          });

          socket.on("user-joined", (user: any) => {
            if (user.userId !== currentUser?.userId && !this.otherPlayers.has(user.userId)) {
              this.createOtherPlayer(user);
            }
          });

          socket.on("room-users", (roomUsers: any[]) => {
            roomUsers.forEach((user) => {
              if (user.userId !== currentUser?.userId && !this.otherPlayers.has(user.userId)) {
                this.createOtherPlayer(user);
              }
            });
          });

          socket.on("user-left", (data: { userId: string }) => {
            if (this.otherPlayers.has(data.userId)) {
              const player = this.otherPlayers.get(data.userId);
              player?.container.destroy();
              this.otherPlayers.delete(data.userId);
            }
          });

          socket.on("chat-message", (data: any) => {
            this.showSpeechBubble(data.userId, data.message);
          });
        }
      }

      update(time: number, delta: number) {
        this.cameras.main.setZoom(
          Phaser.Math.Interpolation.Linear([this.cameras.main.zoom, this.targetZoom], 0.1)
        );

        if (isOverviewMode !== isOverviewModeRef.current) {
          isOverviewModeRef.current = isOverviewMode;
        }

        this.updatePlayerPosition(this.wasd);
        this.checkInteractions(this.wasd);
        this.updateNPCs();
      }

      showSpeechBubble(userId: string, message: string) {
        let container: Phaser.GameObjects.Container | undefined;

        if (userId === currentUser?.userId) {
          container = this.playerContainer;
        } else if (this.otherPlayers.has(userId)) {
          container = this.otherPlayers.get(userId)?.container;
        }

        if (!container) return;

        const existingBubble = container.getData("speechBubble");
        if (existingBubble) {
          existingBubble.destroy();
        }

        const bubbleContainer = this.add.container(0, -60);

        const text = this.add.text(0, 0, message.length > 20 ? message.substring(0, 20) + "..." : message, {
          fontSize: "14px",
          color: "#000000",
          backgroundColor: "#ffffff",
          padding: { x: 8, y: 4 },
          align: "center"
        });
        text.setOrigin(0.5);

        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-text.width / 2 - 4, -text.height / 2 - 4, text.width + 8, text.height + 8, 8);
        bg.lineStyle(1, 0xcccccc, 1);
        bg.strokeRoundedRect(-text.width / 2 - 4, -text.height / 2 - 4, text.width + 8, text.height + 8, 8);

        const tail = this.add.graphics();
        tail.fillStyle(0xffffff, 1);
        tail.fillTriangle(0, text.height / 2 + 4, -6, text.height / 2 + 4, 0, text.height / 2 + 10);

        bubbleContainer.add([bg, tail, text]);
        container.add(bubbleContainer);
        container.setData("speechBubble", bubbleContainer);

        this.time.delayedCall(5000, () => {
          if (bubbleContainer.active) {
            bubbleContainer.destroy();
            container?.setData("speechBubble", null);
          }
        });
      }

      createOfficeObjects() {
        const addObject = (key: string, x: number, y: number, scale = 1, collides = true) => {
          const obj = this.physics.add.image(x, y, key);
          obj.setScale(scale);
          if (collides) {
            obj.setImmovable(true);
            obj.body.setSize(obj.width * 0.8, obj.height * 0.5);
            obj.body.setOffset(obj.width * 0.1, obj.height * 0.5);
            if (this.playerContainer) {
              this.physics.add.collider(this.playerContainer, obj);
            }
          }
          return obj;
        };

        addObject("desk", 200, 200);
        this.add.image(200, 190, "laptop").setScale(0.8);
        addObject("desk", 350, 200);
        this.add.image(350, 190, "laptop").setScale(0.8);
        addObject("desk", 200, 350);
        this.add.image(200, 340, "laptop").setScale(0.8);
        addObject("desk", 350, 350);
        this.add.image(350, 340, "laptop").setScale(0.8);
        addObject("card_table", 600, 250, 1.2);
        this.add.image(600, 240, "coffee_cup").setScale(0.5);
        this.add.image(620, 260, "coffee_cup").setScale(0.5);
        addObject("water_cooler", 800, 100);
        addObject("coffee_maker", 850, 100);
        addObject("sink", 900, 100);
        addObject("bin", 950, 120, 1, false);
        addObject("copy_machine", 100, 500);
        addObject("mailboxes", 150, 500);
        const tv = addObject("tv", 600, 100);
        tv.setFlipX(false);
      }

      createAnimations() {
        const createSingleCharAnims = (key: string) => {
          const directions = ["down", "left", "right", "up"];
          directions.forEach((dir) => {
            const startFrame = 0;
            this.anims.create({
              key: `${key}-walk-${dir}`,
              frames: this.anims.generateFrameNumbers(key, {
                frames: [startFrame, startFrame + 1, startFrame + 2]
              }),
              frameRate: 8,
              repeat: -1,
              yoyo: true
            });
            this.anims.create({
              key: `${key}-idle-${dir}`,
              frames: [{ key: key, frame: startFrame + 1 }],
              frameRate: 1,
              repeat: -1
            });
          });
        };
        createSingleCharAnims("player");
        createSingleCharAnims("npc1");
        createSingleCharAnims("npc2");
      }

      createPlayer() {
        const startX = currentUser?.position?.x || this.playerPosition.x;
        const startY = currentUser?.position?.y || this.playerPosition.y;
        this.playerPosition.x = startX;
        this.playerPosition.y = startY;

        this.playerContainer = this.add.container(startX, startY);
        this.playerContainer.setSize(32, 32);
        this.physics.world.enable(this.playerContainer);
        const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(24, 24);
        body.setOffset(-12, 12);

        this.playerSprite = this.add.sprite(0, 0, "player");
        this.playerContainer.add(this.playerSprite);

        this.playerNameLabel = this.add.text(0, -25, currentUser?.username || "You", {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
        this.playerContainer.add(this.playerNameLabel);

        this.playAnimation("idle-down");

        if (this.wallLayer) {
          this.physics.add.collider(this.playerContainer, this.wallLayer);
        }
      }

      createNPC(x: number, y: number, name: string) {
        const container = this.add.container(x, y);
        container.setSize(32, 32);
        this.physics.world.enable(container);
        const body = container.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setSize(24, 24);
        body.setOffset(-12, 12);

        const type = name === "Receptionist" ? "npc1" : "npc2";
        const sprite = this.add.sprite(0, 0, type);
        container.add(sprite);

        const nameLabel = this.add.text(0, -25, name, {
          fontSize: "12px",
          color: "#ffff00",
          backgroundColor: "#000000",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
        container.add(nameLabel);

        sprite.play(`${type}-idle-down`, true);
        container.setData("sprite", sprite);
        container.setData("type", type);
        this.npcs.push(container);

        if (this.playerContainer) {
          this.physics.add.collider(this.playerContainer, container);
        }
      }

      updateNPCs() {
        this.npcs.forEach((npc) => {
          const body = npc.body as Phaser.Physics.Arcade.Body;
          const sprite = npc.getData("sprite") as Phaser.GameObjects.Sprite;
          const type = npc.getData("type") as string;

          if (Phaser.Math.Between(0, 1000) < 20) {
            const dir = Phaser.Math.Between(0, 4);
            const speed = 30;
            body.setVelocity(0);
            if (dir === 0) {
              sprite.play(`${type}-idle-down`, true);
            } else if (dir === 1) {
              body.setVelocityX(-speed);
              sprite.play(`${type}-walk-left`, true);
            } else if (dir === 2) {
              body.setVelocityX(speed);
              sprite.play(`${type}-walk-right`, true);
            } else if (dir === 3) {
              body.setVelocityY(-speed);
              sprite.play(`${type}-walk-up`, true);
            } else if (dir === 4) {
              body.setVelocityY(speed);
              sprite.play(`${type}-walk-down`, true);
            }
          }
          if (npc.x < 32) npc.x = 32;
          if (npc.y < 32) npc.y = 32;
          if (npc.x > 30 * 32 - 32) npc.x = 30 * 32 - 32;
          if (npc.y > 20 * 32 - 32) npc.y = 20 * 32 - 32;
        });
      }

      createOtherPlayer(user: any) {
        const pos = user.position || { x: 100, y: 100 };
        const container = this.add.container(pos.x, pos.y);
        container.setSize(32, 32);
        
        const sprite = this.add.sprite(0, 0, "player");
        container.add(sprite);
        
        const nameLabel = this.add.text(0, -25, user.username || "User", {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
        container.add(nameLabel);
        
        this.otherPlayers.set(user.userId, {
          container,
          sprite,
          label: nameLabel
        });
        
        // Play appropriate animation based on direction or default
        const direction = user.direction || "idle-down";
        const animName = direction.startsWith("idle") ? direction : `walk-${direction}`;
        const fullAnim = `player-${animName}`;
        if (this.anims.exists(fullAnim)) {
          sprite.play(fullAnim, true);
        } else {
          sprite.play("player-idle-down", true);
        }
      }

      updateOtherPlayer(userId: string, position: { x: number; y: number }, direction?: string) {
        const player = this.otherPlayers.get(userId);
        if (!player) return;
        
        // Smooth position interpolation
        const currentX = player.container.x;
        const currentY = player.container.y;
        const targetX = position.x;
        const targetY = position.y;
        
        // Use Phaser's tween for smooth movement (optional, can use direct setPosition for instant)
        if (Math.abs(currentX - targetX) > 1 || Math.abs(currentY - targetY) > 1) {
          this.tweens.add({
            targets: player.container,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Linear'
          });
        } else {
          player.container.setPosition(targetX, targetY);
        }
        
        // Update animation if direction provided
        if (direction) {
          const animName = direction.startsWith("idle") ? direction : `walk-${direction}`;
          const fullAnim = `player-${animName}`;
          if (this.anims.exists(fullAnim)) {
            player.sprite.play(fullAnim, true);
          }
        }
      }

      playAnimation(animName: string) {
        if (!this.playerSprite) return;
        const fullAnim = `player-${animName}`;
        if (this.anims.exists(fullAnim)) {
          this.playerSprite.play(fullAnim, true);
        }
      }

      updatePlayerPosition(wasd?: any) {
        if (!this.playerContainer || !this.cursors) return;
        if (this.isSitting) {
          if (Phaser.Input.Keyboard.JustDown(wasd?.W) || Phaser.Input.Keyboard.JustDown(wasd?.S) ||
            Phaser.Input.Keyboard.JustDown(wasd?.A) || Phaser.Input.Keyboard.JustDown(wasd?.D)) {
            this.isSitting = false;
          } else {
            return;
          }
        }

        const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        let moved = false;
        let direction = "down";
        let anim = "idle-down";

        if (this.cursors.left.isDown || wasd?.A?.isDown) {
          body.setVelocityX(-this.moveSpeed);
          moved = true;
          direction = "left";
          anim = "walk-left";
          this.playerSprite?.setFlipX(false);
        } else if (this.cursors.right.isDown || wasd?.D?.isDown) {
          body.setVelocityX(this.moveSpeed);
          moved = true;
          direction = "right";
          anim = "walk-right";
          this.playerSprite?.setFlipX(true);
        }

        if (this.cursors.up.isDown || wasd?.W?.isDown) {
          body.setVelocityY(-this.moveSpeed);
          moved = true;
          direction = "up";
          anim = "walk-up";
        } else if (this.cursors.down.isDown || wasd?.S?.isDown) {
          body.setVelocityY(this.moveSpeed);
          moved = true;
          direction = "down";
          anim = "walk-down";
        }

        if (moved) {
          this.playAnimation(anim);
          this.lastDirection = direction;
          this.wasMoving = true;
        } else {
          this.playAnimation(`idle-${this.lastDirection}`);

          if (this.wasMoving) {
            this.wasMoving = false;
            if (socket) {
              socket.emit("playerMovement", {
                x: this.playerPosition.x,
                y: this.playerPosition.y,
                position: this.playerPosition,
                direction: `idle-${this.lastDirection}`,
              });
            }
          }
        }

        this.playerPosition.x = this.playerContainer.x;
        this.playerPosition.y = this.playerContainer.y;

        this.updateZoneIndicator();

        if (moved) {
          const distance = Phaser.Math.Distance.Between(
            this.lastSentPosition.x,
            this.lastSentPosition.y,
            this.playerPosition.x,
            this.playerPosition.y
          );

          if (distance > 5 && socket) {
            socket.emit("playerMovement", {
              x: this.playerPosition.x,
              y: this.playerPosition.y,
              position: this.playerPosition,
              direction,
            });
            this.lastSentPosition = { ...this.playerPosition };
          }
        }
      }

      checkInteractions(wasd?: any) {
        if (!this.playerContainer || !this.interactiveObjects) return;

        let closestObj: Phaser.GameObjects.Zone | null = null;
        let minDist = 50;

        this.interactiveObjects.getChildren().forEach((child) => {
          const zone = child as Phaser.GameObjects.Zone;
          const dist = Phaser.Math.Distance.Between(
            this.playerContainer!.x, this.playerContainer!.y,
            zone.x, zone.y
          );

          if (dist < minDist) {
            minDist = dist;
            closestObj = zone;
          }
        });

        if (closestObj) {
          const type = (closestObj as Phaser.GameObjects.Zone).getData("type");
          const name = (closestObj as Phaser.GameObjects.Zone).getData("name");

          if (type === "chair") {
            setInteractionPrompt(`Press E to Sit on ${name}`);
            if (Phaser.Input.Keyboard.JustDown(wasd?.E)) {
              this.isSitting = true;
              this.playerContainer.setPosition((closestObj as Phaser.GameObjects.Zone).x, (closestObj as Phaser.GameObjects.Zone).y);
              this.playAnimation("idle-down");
            }
          } else {
            setInteractionPrompt(`Press E to Interact with ${name}`);
          }
        } else {
          setInteractionPrompt(null);
        }
      }

      createZoneIndicator() {
        this.zoneIndicator = this.add.container(10, 10);
        this.zoneIndicator.setScrollFactor(0);
        this.zoneIndicator.setDepth(1000);
        this.zoneIndicator.setVisible(false);

        const bg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.7);
        bg.setOrigin(0, 0);

        this.zoneText = this.add.text(10, 10, "", {
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold"
        });

        this.zoneIndicator.add([bg, this.zoneText]);
      }

      updateZoneIndicator() {
        if (!mapData?.zones) return;

        const zoneId = getZoneForPosition(
          this.playerPosition.x,
          this.playerPosition.y,
          mapData.zones
        );

        if (zoneId) {
          const zone = mapData.zones.find((z: any) => z.id === zoneId);
          if (zone) {
            this.zoneText?.setText(`🔊 ${zone.name}`);
            this.zoneIndicator?.setVisible(true);
            setCurrentZone({ id: zone.id, name: zone.name });
          }
        } else {
          this.zoneIndicator?.setVisible(false);
          setCurrentZone(null);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth - 300,
      height: window.innerHeight - 60,
      parent: "phaser-game",
      backgroundColor: "#F0F4F8", // Pastel Blue-Grey
      scene: MainScene,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      if (socket) {
        socket.off("playerMoved");
        socket.off("allPlayersPositions");
        socket.off("user-joined");
        socket.off("user-left");
        socket.off("room-users");
        socket.off("chat-message");
      }
    };
  }, [currentUser, socket, mapData]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <SimplifiedMap visible={isOverviewMode} onClose={() => setIsOverviewMode(false)} />
      <div id="phaser-game" style={{ width: "100%", height: "100%" }} />
      {currentZone && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(99, 102, 241, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 100,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🔊</span>
          <span>{currentZone.name}</span>
        </div>
      )}
      {interactionPrompt && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#fbbf24", // Amber color
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            zIndex: 100,
            pointerEvents: "none",
            animation: "fadeIn 0.2s ease-in-out"
          }}
        >
          {interactionPrompt}
        </div>
      )}

      {/* Notification Button */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <button
          onClick={() => setShowNotifications(true)}
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            fontSize: "20px",
            position: "relative",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)")}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "#ef4444",
                color: "white",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 4px",
                borderRadius: "8px",
                minWidth: "14px",
                textAlign: "center",
                lineHeight: "1.2"
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default GameScene;
