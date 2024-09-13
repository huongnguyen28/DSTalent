const e = require('express');
const { Op, Sequelize, where } = require('sequelize');
const db = require('../configs/db');
const Document = db.document;
const Tag = db.tag;
const Document_Tag = db.document_tag;
const Document_Access = db.document_access;
const User = db.user;
const { STATUS_CODE, formatResponse } = require("../utils/services");

const deleteDocument = async (req, res) => {
  try {
    if(req.document.document_access_level !== 2) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.FORBIDDEN,
        "You don't have permission to delete this document!"
      )
    }

    const documentId = req.params.document_id;
    await Document.update(
      {is_active: false},
      {where: {document_id: documentId}}
    );
    return formatResponse(
      res,
      {
        document_id: documentId,
        deleteAt: new Date()
      },
      STATUS_CODE.SUCCESS,
      "Document deleted successfully!"
    );
  } catch(error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to delete document!"
    );
  }
};

const uploadDocument = async (req, res) => {
  try {
    const {document_name, price, access_days, full_content_path, preview_content_path, description, tags} = req.body;
    const uploaded_by = req.user.user_id;
    const communityID = req.params.community_id;

    const tagsToCreate = [];

    for (const tag of tags) {
      const [existingTag, created] = await Tag.findOrCreate({
        where: { tag_name: tag },
        defaults: { tag_name: tag }
      });
      tagsToCreate.push(existingTag);
    }
    
    const newDocument = await Document.create({
      document_name,
      community_id: communityID,
      price,
      access_days,
      full_content_path,
      preview_content_path,
      description,
      uploaded_by
    });
    
    const tag_arr_id = tagsToCreate.map(tag => tag.tag_id);
    const documentTagsToCreate = tag_arr_id.map(tagId => ({
      document_id: newDocument.document_id,
      tag_id: tagId
    }));
    
    await Document_Tag.bulkCreate(documentTagsToCreate, {
      ignoreDuplicates: true
    });
    
    await Document_Access.create({
      document_id: newDocument.document_id,
      user_id: uploaded_by,
      document_access_level: 2,
      purchase_date: newDocument.createAt,
      price_paid: -1,
      expired_date: new Date("9999-12-31T23:59:59.999Z")
    });

    return formatResponse(
      res,
      {
        document_id: newDocument.document_id,
        document_name: newDocument.document_name,
        community_id: newDocument.community_id,
        privacy: newDocument.privacy,
        price: newDocument.price,
        rent_days: newDocument.access_days,
        tags,
        full_file_url: newDocument.full_content_path,
        preview_file_url: newDocument.preview_content_path,
        description: newDocument.description,
        uploaded_by: newDocument.uploaded_by,
        createdAt: newDocument.createAt,
      },
      STATUS_CODE.CREATED,
      "Document uploaded successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to upload document!"
    );
  }
};

const updateDocumentAccessLevel = async (req, res) => {
  try {
    const requesterID = req.user.user_id;
    const userID = req.params.user_id;
    const documentID = req.params.document_id;

    const userInDb =  await User.findOne({
      where: {
        user_id: userID
      }
    });

    if (!userInDb) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "User not found!"
      )
    };

    const documentInDb = await Document.findOne({
      where: {
        document_id: documentID
      }
    });

    if (!documentInDb) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Document not found!"
      );
    }

    if(documentInDb.uploaded_by !== requesterID) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.FORBIDDEN,
        "You don't have permission to update access level for other users on this document!"
      );
    }

    const {document_access_level} = req.body;

    const existingAccess = await Document_Access.findOne({
      where: {
        document_id: documentID,
        user_id: userID
      }
    });

    if (existingAccess) {
      await Document_Access.destroy({
      where: {
        document_id: documentID,
        user_id: userID
      }
      });
    }
    
    if(document_access_level === 0) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.SUCCESS,
        "User access level on this document updated successfully!"
      );
    }

    await Document_Access.create({
      document_id: documentID,
      user_id: userID,
      document_access_level
    });

    return formatResponse(
      res,
      {
        document_id: documentID,
        user_id: userID,
        document_access_level
      },
      STATUS_CODE.SUCCESS,
      "User access level on this document updated successfully!"
    );

  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to update user access level on this document!"
    );
  }
};

const searchDocument = async (req, res) => {
  try {
    const communityId = req.params.community_id;
    const userID = req.user.user_id;  
    const { query, page = 1, limit = 20, sort, is_default } = req.query;

    const tags = Array.isArray(req.query.tags) ? req.query.tags : req.query.tags ? req.query.tags.split(',') : [];

    const offset = (Number(page) - 1) * limit;
    const attributes = {
      include: [
        [Sequelize.literal(`uploaded_by = ${userID}`), 'is_owner'],
        [Sequelize.literal(`EXISTS(SELECT 1 FROM document_access WHERE document_access.document_id = document.document_id AND document_access.user_id = ${userID})`), 'is_accessed'],
      ],
      exclude: ['is_active', 'updatedAt', 'community_id', 'document_id', 'full_content_path']
    };

    const include = [
      {
        model: Document_Access,
        required: false,
        where : {user_id: userID},
        attributes: []
      }
    ]
    let documents;

    if(is_default === '1') {
      documents = await Document.findAndCountAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [ 
                {privacy: 'public'},
                {uploaded_by: userID},
              ]
            },
            {
              is_active: true
            },
            {
              community_id: communityId
            }
          ]
        },
        offset,
        limit: Number(limit),
        include,
        attributes,
        order: [
          [Sequelize.literal(`CASE WHEN uploaded_by = ${userID} THEN 0 ELSE 1 END`), 'ASC'],
          [Sequelize.literal(`CASE WHEN uploaded_by = ${userID} THEN privacy ELSE NULL END`), 'DESC'],
        ]
      });
    } else {
      let wheres = {}
      let order = [];
      let having;
      let group;
      let include2 = [];
      if(query) {
        wheres.document_name = {
          [Op.like]: `%${query}%`
        }; 
      }
      if(sort) {
        order = [sort.split(',')];
      }
      if(tags.length > 0) {
        let tagsCount = tags.length;
        include2.push({
          model: Document_Tag,
          required: true,
          attributes: [],
          include: [ {
              model: Tag,
              required: true,
              where: {
                tag_name: {
                  [Op.in]: tags
                } 
              },
              attributes: []
            }
          ]
        });
        group = ['document.document_id'];
        having = Sequelize.where(
          Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('document_tags->tag.tag_name'))),
          '=',
          tagsCount
        )
      }

      documents = await Document.findAll({
        include: include2,
        where: {
          [Op.and]: [
            wheres,
            {
              [Op.or]: [ 
                {privacy: 'public'},
                {uploaded_by: userID},
              ]
            },
            {
              is_active: true
            },
            {
              community_id: communityId
            }
          ]
        },
        group,
        having,
      });

      const documentIds = documents.map(document => document.document_id);
      
      documents = await Document.findAndCountAll({
        offset,
        limit: Number(limit),
        where: {
          document_id: {
            [Op.in]: documentIds
          }
        },
        include,
        attributes,
        order
      });
      
    }

    const totalPage = Math.ceil(documents.count / limit);
    if (page > totalPage) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Page not found!"
      );
    }
    const pagination = {
      "currentPage": Number(page),
      "pageSize": Number(limit),
      "totalPage": totalPage,  
      "hasNext": page < totalPage,
    };
    const data = {
      documents: documents.rows,
      pagination
    };
    return formatResponse(
      res,
      data,
      STATUS_CODE.SUCCESS,
      "Get document list successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to search document!"
    );

  }
};

const viewSpecificDocument = async (req, res) => {
  try {
    const documentId = req.params.document_id;
    const userId = req.user.user_id; 

    const document = await Document.findOne({ where: { document_id: documentId } });

    if (!document) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Document not found!"
      );
    }

    if (document.privacy === 'public' || document.uploaded_by === userId) {
      return formatResponse(
        res,
        document,
        STATUS_CODE.SUCCESS,
        "Document retrieved successfully."
      );
    }

    else {
      const documentAccess = await Document_Access.findOne({
        where: {
          document_id: documentId,
          user_id: userId,
          expired_date: { [Op.lte]: new Date() }, // Ensure access has not expired
        }
      });

      if (!documentAccess) {
        return formatResponse(
          res,
          {},
          STATUS_CODE.FORBIDDEN,
          "Access denied or document access has expired!"
        );
      }
    }

    return formatResponse(
      res,
      document,
      STATUS_CODE.SUCCESS,
      "Document retrieved successfully."
    );

  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const updateDocument = async(req, res) => {
  try {
    if(req.document.document_access_level !== 2) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.FORBIDDEN,
        "You don't have permission to update this document!"
      )
    }
    const documentId = req.params.document_id;

    const existingDocument = await Document.findOne(
      {
        where: { document_id: documentId }
      }
    );

    const {document_name, price, access_days, full_content_path, preview_content_path, description, privacy, tags} = req.body;
    let modifed_tags = false;

    if (typeof tags !== 'undefined') {
      modifed_tags = true;
      
      await Document_Tag.destroy({ where: { document_id: documentId } });
    
      const tagsToCreate = [];
    
      for (const tag of tags) {
        const [existingTag, created] = await Tag.findOrCreate({
          where: { tag_name: tag },
          defaults: { tag_name: tag }
        });
        tagsToCreate.push(existingTag);
      }
    
      const tag_arr_id = tagsToCreate.map(tag => tag.tag_id);
    
      const documentTagsToCreate = tag_arr_id.map(tagId => ({
        document_id: documentId,
        tag_id: tagId
      }));
    
      await Document_Tag.bulkCreate(documentTagsToCreate, {
        ignoreDuplicates: true
      });
    }
    
    const updatedDocument = await Document.update(
      {
        document_name: document_name || existingDocument.document_name,
        price: price || existingDocument.price,
        access_days: access_days || existingDocument.access_days,
        full_content_path: full_content_path || existingDocument.full_content_path,
        preview_content_path: preview_content_path || existingDocument.preview_content_path,
        description: description || existingDocument.description,
        privacy: privacy || existingDocument.privacy
      },
      {
        where: { document_id: documentId },
      }
    );

    if (updatedDocument[0] === 0 && !modifed_tags) { 
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_MODIFIED,
        "No changes were made!"
      );
    }

    return formatResponse(
      res,
      {
        document_name,
        price,
        access_days,
        tags,
        full_content_path,
        preview_content_path,
        description,
        privacy,
      },
      STATUS_CODE.SUCCESS,
      "Document updated successfully!"
    );
   
  } catch(error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to update document!"
    );
  }
};

module.exports = {
  deleteDocument,
  uploadDocument,
  updateDocumentAccessLevel,
  searchDocument,
  viewSpecificDocument,
  updateDocument
}