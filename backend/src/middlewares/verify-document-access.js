const db = require("../configs/db");
const { formatResponse, STATUS_CODE } = require("../utils/services");
const Document_Access = db.document_access;

const verifyDocumentAccess = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const documentId = req.params.document_id;

    const documentAccessInDb = await Document_Access.findOne({
      where: { document_id: documentId, user_id: userId },
    });

    if (documentAccessInDb === null) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "User does not have access to this document!"
      );
    }

    req.document = documentAccessInDb.dataValues;
    
    next();
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to verify document access!"
    );
  }
};

module.exports = {
    verifyDocumentAccess
};
