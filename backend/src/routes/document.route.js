const express = require("express");
const router = express.Router();
const path = require('path');
const multer = require('multer');
const storage = require("../configs/multer");
const upload = multer({ storage });

const {
  deleteDocument,
  searchDocument,
  updateDocument,
  viewSpecificDocument,
  deleteDocumentFile
} = require("../controllers/document.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyDocumentAccess } = require("../middlewares/verify-document-access");
const { verifyDocumentFull } = require("../middlewares/verify-document-full");
const { verifyDocumentPreview } = require("../middlewares/verify-document-preview");

router.use(verifyToken);

router.route("/:document_id")
  .delete(verifyDocumentAccess, deleteDocument)
  .get(verifyDocumentAccess, viewSpecificDocument)
  .patch(verifyDocumentAccess, upload.array('document'), updateDocument);

router.route("/:document_id/file")
  .delete(verifyDocumentAccess, deleteDocumentFile)

router.use('/preview', verifyDocumentPreview, express.static(path.join(__dirname, '../../public/upload')));
router.use('/full', verifyDocumentFull, express.static(path.join(__dirname, '../../public/upload')));

// router.use('/full/:filename', verifyDocumentFull, (req, res) => {
//   const filename = req.params.filename
//   const filePath = path.join(__dirname, '../../public/upload/', filename); // Update the file path and name
//   res.download(filePath, (err) => {
//     if (err) {
//       console.error('Error downloading file:', err);
//       res.status(500).send('File download failed.');
//     }
//   });
// });

module.exports = router;
