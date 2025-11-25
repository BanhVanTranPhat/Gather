import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { useSocket } from "../contexts/SocketContext";
import { useWebRTC } from "../contexts/WebRTCContext";
import { useMap } from "../contexts/MapContext";
import {
  loadAssets,
  generateFallbackTileset,
  generateFallbackAvatar,
} from "../utils/assetLoader";
import { isTouchDevice, throttle } from "../utils/performance";

const GameScene = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { socket, users, currentUser } = useSocket();
  const { localStream } = useWebRTC();
  const { mapData } = useMap();

  useEffect(() => {
    if (!currentUser) return;

    // Store mapData in closure
    const currentMapData = mapData;

    class MainScene extends Phaser.Scene {
      private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
      private player?: Phaser.GameObjects.Sprite;
      private playerNameLabel?: Phaser.GameObjects.Text;
      private otherPlayers: Map<
        string,
        { sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
      > = new Map();
      private map?: Phaser.Tilemaps.Tilemap;
      private tileset?: Phaser.Tilemaps.Tileset;
      private walls?: Phaser.Tilemaps.TilemapLayer;
      private floor?: Phaser.Tilemaps.TilemapLayer;
      private playerPosition = { x: 100, y: 100 };
      private lastSentPosition = { x: 0, y: 0 };
      private moveSpeed = 100;

      constructor() {
        super({ key: "MainScene" });
      }

      preload() {
        // Load assets with fallback
        generateFallbackTileset(this);
        generateFallbackAvatar(this);

        // Try to load actual assets if available
        try {
          this.load.image("tileset_floor", "/assets/tiles/floor.png");
          this.load.image("tileset_wall", "/assets/tiles/wall.png");
          this.load.image("tileset_grass", "/assets/tiles/grass.png");
          this.load.spritesheet(
            "avatar_spritesheet",
            "/assets/characters/avatar.png",
            {
              frameWidth: 32,
              frameHeight: 32,
            }
          );
        } catch (error) {
          console.log("Using fallback assets");
        }
      }

      create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.tileSize = currentMapData?.tileSize || 32;

        // Load map data if available
        if (currentMapData) {
          this.mapData = currentMapData;
          this.collisionMap = currentMapData.collision || [];
          this.renderMap(currentMapData);
        } else {
          // Fallback: render default grid
          this.renderDefaultMap(width, height);
        }

        // Create some furniture/obstacles (legacy, can be removed later)
        this.createFurniture();

        // Create player sprite with better graphics
        // Try to use spritesheet first, then fallback frames, then simple sprite
        if (this.textures.exists("avatar_spritesheet")) {
          this.player = this.add.sprite(
            this.playerPosition.x,
            this.playerPosition.y,
            "avatar_spritesheet"
          );
          this.player.setFrame(0);
        } else if (this.textures.exists("avatar_frame_0")) {
          // Use generated fallback frames
          this.player = this.add.sprite(
            this.playerPosition.x,
            this.playerPosition.y,
            "avatar_frame_0"
          );
        } else {
          // Ultimate fallback: colored circle
          const avatarColor = localStorage.getItem("avatarColor") || "#4f46e5";
          const colorInt = parseInt(avatarColor.replace("#", ""), 16);
          this.player = this.add.circle(
            this.playerPosition.x,
            this.playerPosition.y,
            16,
            colorInt
          );
        }

        if (this.player instanceof Phaser.GameObjects.Sprite) {
          this.player.setScale(1);
          this.player.setDisplaySize(32, 32);
        }

        // Add player name label
        this.playerNameLabel = this.add.text(
          this.playerPosition.x,
          this.playerPosition.y - 25,
          currentUser?.username || "You",
          {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 4, y: 2 },
          }
        );
        this.playerNameLabel.setOrigin(0.5);

        // Create other players
        users.forEach((user) => {
          if (user.userId !== currentUser?.userId) {
            this.createOtherPlayer(user);
          }
        });

        // Keyboard input
        this.cursors = this.input.keyboard?.createCursorKeys();
        const wasd = this.input.keyboard?.addKeys("W,S,A,D");

        // Update loop
        this.time.addEvent({
          delay: 50,
          callback: () => {
            this.updatePlayerPosition(wasd);
          },
          loop: true,
        });
      }

      renderMap(mapData: any) {
        const {
          tiles,
          collision,
          width: mapWidth,
          height: mapHeight,
          tileSize,
        } = mapData;
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Render tiles
        for (let y = 0; y < mapHeight && y * tileSize < screenHeight; y++) {
          for (let x = 0; x < mapWidth && x * tileSize < screenWidth; x++) {
            const tileId = tiles[y]?.[x] || 0;
            const tileX = x * tileSize + tileSize / 2;
            const tileY = y * tileSize + tileSize / 2;

            // Render tiles with better graphics
            if (tileId === 0) {
              // Floor: Try to use tileset, fallback to generated
              if (this.textures.exists("tileset_floor")) {
                this.add.image(tileX, tileY, "tileset_floor").setOrigin(0.5);
              } else if (this.textures.exists("tile_floor")) {
                this.add.image(tileX, tileY, "tile_floor").setOrigin(0.5);
              } else {
                // Fallback: checkered pattern
                const isEven = (x + y) % 2 === 0;
                const tileColor = isEven ? 0x4a5568 : 0x2d3748;
                this.add.rectangle(tileX, tileY, tileSize, tileSize, tileColor);
              }
            } else if (tileId === 1) {
              // Wall: Try to use tileset, fallback to generated
              if (this.textures.exists("tileset_wall")) {
                this.add.image(tileX, tileY, "tileset_wall").setOrigin(0.5);
              } else if (this.textures.exists("tile_wall")) {
                this.add.image(tileX, tileY, "tile_wall").setOrigin(0.5);
              } else {
                // Fallback: brown rectangle
                this.add.rectangle(tileX, tileY, tileSize, tileSize, 0x8b4513);
                this.add
                  .rectangle(tileX, tileY, tileSize, tileSize, 0x654321)
                  .setStrokeStyle(2, 0x000000);
              }
            }
          }
        }

        // Render grid lines (optional, can be toggled)
        this.renderGrid(screenWidth, screenHeight, tileSize);
      }

      renderDefaultMap(width: number, height: number) {
        const tileSize = this.tileSize;

        // Render default checkered floor
        for (let x = 0; x < width; x += tileSize) {
          for (let y = 0; y < height; y += tileSize) {
            const isEven = (x / tileSize + y / tileSize) % 2 === 0;
            const tileColor = isEven ? 0x4a5568 : 0x2d3748;
            this.add.rectangle(
              x + tileSize / 2,
              y + tileSize / 2,
              tileSize,
              tileSize,
              tileColor
            );
          }
        }

        this.renderGrid(width, height, tileSize);
      }

      renderGrid(width: number, height: number, tileSize: number) {
        // Grid lines
        for (let x = 0; x < width; x += tileSize) {
          this.add.line(0, 0, x, 0, x, height, 0x1a202c, 0.3).setOrigin(0);
        }
        for (let y = 0; y < height; y += tileSize) {
          this.add.line(0, 0, 0, y, width, y, 0x1a202c, 0.3).setOrigin(0);
        }
      }

      createFurniture() {
        // Legacy function, can be removed or repurposed
        // Furniture is now handled by Objects system
      }

      updatePlayerPosition(wasd?: any) {
        if (!this.player || !this.cursors) return;

        let moved = false;
        let direction = "";

        if (this.cursors.left.isDown || wasd?.A?.isDown) {
          this.playerPosition.x -= this.moveSpeed * 0.05;
          moved = true;
          direction = "left";
          // Update sprite frame for left
          if (this.player instanceof Phaser.GameObjects.Sprite) {
            if (this.textures.exists("avatar_spritesheet")) {
              this.player.setFrame(1); // Left frame
            } else if (this.textures.exists("avatar_frame_1")) {
              this.player.setTexture("avatar_frame_1");
            }
          }
        } else if (this.cursors.right.isDown || wasd?.D?.isDown) {
          this.playerPosition.x += this.moveSpeed * 0.05;
          moved = true;
          direction = "right";
          // Update sprite frame for right
          if (this.player instanceof Phaser.GameObjects.Sprite) {
            if (this.textures.exists("avatar_spritesheet")) {
              this.player.setFrame(2); // Right frame
            } else if (this.textures.exists("avatar_frame_2")) {
              this.player.setTexture("avatar_frame_2");
            }
          }
        }

        if (this.cursors.up.isDown || wasd?.W?.isDown) {
          this.playerPosition.y -= this.moveSpeed * 0.05;
          moved = true;
          direction = "up";
          // Update sprite frame for up
          if (this.player instanceof Phaser.GameObjects.Sprite) {
            if (this.textures.exists("avatar_spritesheet")) {
              this.player.setFrame(3); // Up frame
            } else if (this.textures.exists("avatar_frame_3")) {
              this.player.setTexture("avatar_frame_3");
            }
          }
        } else if (this.cursors.down.isDown || wasd?.S?.isDown) {
          this.playerPosition.y += this.moveSpeed * 0.05;
          moved = true;
          direction = "down";
          // Update sprite frame for down
          if (this.player instanceof Phaser.GameObjects.Sprite) {
            if (this.textures.exists("avatar_spritesheet")) {
              this.player.setFrame(0); // Down frame
            } else if (this.textures.exists("avatar_frame_0")) {
              this.player.setTexture("avatar_frame_0");
            }
          }
        }

        // Collision detection với map
        if (this.collisionMap && this.mapData) {
          const tileX = Math.floor(this.playerPosition.x / this.tileSize);
          const tileY = Math.floor(this.playerPosition.y / this.tileSize);

          if (this.collisionMap[tileY]?.[tileX]) {
            // Collision detected, revert position
            this.playerPosition.x = this.lastSentPosition.x;
            this.playerPosition.y = this.lastSentPosition.y;
            moved = false;
          }
        }

        // Keep player in bounds
        this.playerPosition.x = Phaser.Math.Clamp(
          this.playerPosition.x,
          20,
          this.scale.width - 20
        );
        this.playerPosition.y = Phaser.Math.Clamp(
          this.playerPosition.y,
          20,
          this.scale.height - 20
        );

        if (moved) {
          this.player.setPosition(this.playerPosition.x, this.playerPosition.y);
          if (this.playerNameLabel) {
            this.playerNameLabel.setPosition(
              this.playerPosition.x,
              this.playerPosition.y - 25
            );
          }

          // Send position update to server (throttled)
          const distance = Phaser.Math.Distance.Between(
            this.lastSentPosition.x,
            this.lastSentPosition.y,
            this.playerPosition.x,
            this.playerPosition.y
          );

          if (distance > 5 && socket) {
            // Emit event "playerMovement" với vị trí (x, y)
            socket.emit("playerMovement", {
              x: this.playerPosition.x,
              y: this.playerPosition.y,
              position: this.playerPosition,
              direction,
            });

            if (currentUser) {
              currentUser.position = this.playerPosition;
            }

            this.lastSentPosition = { ...this.playerPosition };
          }
        }
      }

      createOtherPlayer(user: any) {
        // Create sprite with better graphics
        let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;

        if (this.textures.exists("avatar_spritesheet")) {
          sprite = this.add.sprite(
            user.position.x,
            user.position.y,
            "avatar_spritesheet"
          );
          (sprite as Phaser.GameObjects.Sprite).setFrame(0);
        } else if (this.textures.exists("avatar_frame_0")) {
          sprite = this.add.sprite(
            user.position.x,
            user.position.y,
            "avatar_frame_0"
          );
        } else {
          // Fallback: colored circle (different color for other players)
          const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
          const colorIndex = user.userId.charCodeAt(0) % colors.length;
          sprite = this.add.circle(
            user.position.x,
            user.position.y,
            16,
            colors[colorIndex]
          );
        }

        if (sprite instanceof Phaser.GameObjects.Sprite) {
          sprite.setScale(1);
          sprite.setDisplaySize(32, 32);
        }

        const nameLabel = this.add.text(
          user.position.x,
          user.position.y - 25,
          user.username,
          {
            fontSize: "12px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 4, y: 2 },
          }
        );
        nameLabel.setOrigin(0.5);

        this.otherPlayers.set(user.userId, { sprite, label: nameLabel });
      }

      updateOtherPlayer(user: any) {
        const playerData = this.otherPlayers.get(user.userId);
        if (playerData) {
          this.tweens.add({
            targets: [playerData.sprite, playerData.label],
            x: user.position.x,
            y: user.position.y,
            duration: 100,
            ease: "Power2",
          });
          // Update label y position separately
          this.tweens.add({
            targets: playerData.label,
            y: user.position.y - 25,
            duration: 100,
            ease: "Power2",
          });
        } else {
          this.createOtherPlayer(user);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth - 300, // Account for sidebar
      height: window.innerHeight - 60, // Account for control bar
      parent: "phaser-game",
      backgroundColor: "#1a1a1a",
      scene: MainScene,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
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
    };
  }, [currentUser, socket, mapData]);

  // Update other players when users array changes
  useEffect(() => {
    if (!gameRef.current || !currentUser) return;

    const scene = gameRef.current.scene.getScene("MainScene") as any;
    if (scene && scene.updateOtherPlayer) {
      users.forEach((user) => {
        if (user.userId !== currentUser.userId) {
          const playerData = scene.otherPlayers?.get(user.userId);
          if (playerData) {
            // Update existing player position
            scene.tweens?.add({
              targets: [playerData.sprite, playerData.label],
              x: user.position.x,
              y: user.position.y,
              duration: 100,
              ease: "Power2",
            });
            scene.tweens?.add({
              targets: playerData.label,
              y: user.position.y - 25,
              duration: 100,
              ease: "Power2",
            });
          } else {
            // Create new player
            scene.createOtherPlayer(user);
          }
        }
      });

      // Remove players who left
      if (scene.otherPlayers) {
        scene.otherPlayers.forEach(
          (
            playerData: {
              sprite: Phaser.GameObjects.Sprite;
              label: Phaser.GameObjects.Text;
            },
            userId: string
          ) => {
            const userExists = users.find(
              (u) => u.userId === userId && u.userId !== currentUser.userId
            );
            if (!userExists) {
              playerData.sprite.destroy();
              playerData.label.destroy();
              scene.otherPlayers.delete(userId);
            }
          }
        );
      }
    }
  }, [users, currentUser]);

  return <div id="phaser-game" style={{ width: "100%", height: "100%" }} />;
};

export default GameScene;
