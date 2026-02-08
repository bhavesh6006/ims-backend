const { Material, MaterialType, SubtoolPosition } = require('../models');

class MaterialController {
  /**
   * Get all materials
   */
  async getAllMaterials(req, res) {
    try {
      const { status, type, location } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (type) whereClause.material_type_id = type;
      if (location) whereClause.current_location_id = location;

      const materials = await Material.findAll({
        where: whereClause,
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Manually fetch and attach subtool positions for each material
      const materialsWithPositions = await Promise.all(
        materials.map(async (material) => {
          const materialJson = material.toJSON();
          
          if (materialJson.subtool_position_id && materialJson.subtool_position_id.length > 0) {
            const positions = await SubtoolPosition.findAll({
              where: {
                subtool_position_id: materialJson.subtool_position_id
              },
              attributes: ['subtool_position_id', 'subtool_position']
            });
            materialJson.subtoolPositions = positions;
          } else {
            materialJson.subtoolPositions = [];
          }
          
          return materialJson;
        })
      );

      res.status(200).json({
        success: true,
        count: materialsWithPositions.length,
        data: materialsWithPositions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve materials',
        error: error.message
      });
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(req, res) {
    try {
      const material = await Material.findOne({
        where: { material_id: req.params.id },
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          }
        ]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'material not found'
        });
      }

      const materialJson = material.toJSON();
      
      // Fetch subtool positions if they exist
      if (materialJson.subtool_position_id && materialJson.subtool_position_id.length > 0) {
        const positions = await SubtoolPosition.findAll({
          where: {
            subtool_position_id: materialJson.subtool_position_id
          },
          attributes: ['subtool_position_id', 'subtool_position']
        });
        materialJson.subtoolPositions = positions;
      } else {
        materialJson.subtoolPositions = [];
      }

      res.status(200).json({
        success: true,
        data: materialJson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material',
        error: error.message
      });
    }
  }

  /**
   * Get material by material code
   */
  async getMaterialByCode(req, res) {
    try {
      const { materialCode } = req.params;

      const material = await Material.findOne({
        where: { material_code: materialCode },
        include: [
          { 
            model: MaterialType, 
            as: 'materialType',
            attributes: ['material_type_id', 'material_type']
          }
        ]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      const materialJson = material.toJSON();
      
      // Fetch subtool positions if they exist
      if (materialJson.subtool_position_id && materialJson.subtool_position_id.length > 0) {
        const positions = await SubtoolPosition.findAll({
          where: {
            subtool_position_id: materialJson.subtool_position_id
          },
          attributes: ['subtool_position_id', 'subtool_position']
        });
        materialJson.subtoolPositions = positions;
      } else {
        materialJson.subtoolPositions = [];
      }

      res.status(200).json({
        success: true,
        data: materialJson
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve material',
        error: error.message
      });
    }
  }

  /**
   * Create new material
   */
  async createMaterial(req, res) {
    try {
      const material = await Material.create(req.body);

      res.status(201).json({
        success: true,
        message: 'material created successfully',
        data: material
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to create material',
        error: error.message
      });
    }
  }

  /**
   * Update material
   */
  async updateMaterial(req, res) {
    try {
      const material = await Material.findOne({ where: { material_id: req.params.id } });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      await material.update(req.body);

      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: material
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update material',
        error: error.message
      });
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(req, res) {
    try {
      const material = await Material.findOne({ where: { material_id: req.params.id } });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        });
      }

      await material.destroy();

      res.status(200).json({
        success: true,
        message: 'Material deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete material',
        error: error.message
      });
    }
  }
}

module.exports = new MaterialController();