const db = require("../configs/db");
const { formatResponse, STATUS_CODE } = require("../utils/services");
const Document = db.document;
const Document_Access = db.document_access

const verifyDocumentFull = async (req, res, next) => {
  try {
    const filename = req.path.substring(1);
    const doc = await Document.findOne({
      where: { full_content_path: filename },
    });

    if (doc === null) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Cannot find document!"
      );
    }

    const userId = req.user.user_id;
    const documentId = doc.dataValues.document_id;
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
    next();
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to verify full document access!"
    );
  }
};

module.exports = {
    verifyDocumentFull
};
