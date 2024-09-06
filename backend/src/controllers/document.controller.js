const e = require('express');
const { Op, Sequelize } = require('sequelize');
const db = require('../configs/db');
const Document = db.document;
const Tag = db.tag;
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
      {active: false},
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


module.exports = {
  deleteDocument
}