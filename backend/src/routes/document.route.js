const express = require("express");
const router = express.Router();
const {
  deleteDocument,
  searchDocument,
  updateDocument,
  viewSpecificDocument,
} = require("../controllers/document.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyDocumentAccess } = require("../middlewares/verify-document-access");

router.use(verifyToken);

router.route("/:document_id")
  .delete(verifyDocumentAccess, deleteDocument)
  .get(viewSpecificDocument)
  .patch(verifyDocumentAccess, updateDocument);

module.exports = router;
