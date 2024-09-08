const express = require("express");
const router = express.Router();
const {
  deleteDocument,
  searchDocument
} = require("../controllers/document.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyDocumentAccess } = require("../middlewares/verify-document-access");

router.use(verifyToken);

router.route("/:document_id")
  .delete(verifyDocumentAccess, deleteDocument)

router.get("/search/communities/:community_id", searchDocument);

module.exports = router;
