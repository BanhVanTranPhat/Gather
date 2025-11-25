import Object from "../models/Object.js";

// Get all objects in a room
export const getObjectsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const objects = await Object.find({ roomId, isActive: true }).sort({
      createdAt: -1,
    });
    res.json(objects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single object
export const getObjectById = async (req, res) => {
  try {
    const { objectId } = req.params;
    const object = await Object.findOne({ objectId, isActive: true });
    if (!object) {
      return res.status(404).json({ message: "Object not found" });
    }
    res.json(object);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new object
export const createObject = async (req, res) => {
  try {
    const { roomId, type, name, position, properties, createdBy } = req.body;

    // Generate unique objectId
    const objectId = `obj-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newObject = new Object({
      objectId,
      roomId,
      type,
      name,
      position,
      properties: properties || {},
      createdBy: createdBy || null,
    });

    await newObject.save();
    res.status(201).json(newObject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update object
export const updateObject = async (req, res) => {
  try {
    const { objectId } = req.params;
    const updates = req.body;

    const object = await Object.findOneAndUpdate(
      { objectId, isActive: true },
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );

    if (!object) {
      return res.status(404).json({ message: "Object not found" });
    }

    res.json(object);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update whiteboard content
export const updateWhiteboardContent = async (req, res) => {
  try {
    const { objectId } = req.params;
    const { content } = req.body;

    const object = await Object.findOneAndUpdate(
      { objectId, type: "whiteboard", isActive: true },
      {
        "properties.content": content,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!object) {
      return res.status(404).json({ message: "Whiteboard not found" });
    }

    res.json(object);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete object (soft delete)
export const deleteObject = async (req, res) => {
  try {
    const { objectId } = req.params;

    const object = await Object.findOneAndUpdate(
      { objectId },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!object) {
      return res.status(404).json({ message: "Object not found" });
    }

    res.json({ message: "Object deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
