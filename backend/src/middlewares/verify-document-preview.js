const db = require("../configs/db");
const { formatResponse, STATUS_CODE } = require("../utils/services");
const Document = db.document;

const verifyDocumentPreview = async (req, res, next) => {
  try {
    const filename = req.path.substring(1);
    const doc = await Document.findOne({
      where: { preview_content_path: filename },
    });

    if (doc === null) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Cannot find document!"
      );
    }    
    next();
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to verify preview document access!"
    );
  }
};

module.exports = {
    verifyDocumentPreview
};
