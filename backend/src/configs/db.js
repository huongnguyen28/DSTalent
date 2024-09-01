const { Sequelize, DataTypes } = require('sequelize');
const mongoose = require('mongoose');
require("dotenv").config();

// Sequelize setup
const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.USER_DB,
    process.env.PASSWORD_DB, {
        host: process.env.HOST_DB,
        dialect: 'mysql',
        // operatorsAliases: false,
    }
);

// MongoDB setup
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Authenticate Sequelize
sequelize.authenticate()
    .then(() => {
        console.log('MySQL connected..');
    })
    .catch(err => {
        console.log('MySQL Error: ' + err);
    });

// Connect MongoDB
connectMongoDB();

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.mongoose = mongoose;

// MySQL models
db.user = require("../models/user.model.js")(sequelize, DataTypes);
db.community = require("../models/community.model.js")(sequelize, DataTypes);
db.basic_test = require("../models/basic_test.model.js")(sequelize, DataTypes);
db.document = require("../models/document.model.js")(sequelize, DataTypes);
db.up_level_request = require("../models/up_level_request.model.js")(
  sequelize,
  DataTypes
);
db.member = require("../models/member.model.js")(sequelize, DataTypes);
db.tag = require("../models/tag.model.js")(sequelize, DataTypes);
db.test = require("../models/test.model.js")(sequelize, DataTypes);
db.wallet = require("../models/wallet.model.js")(sequelize, DataTypes);
db.user_wallet = require("../models/user_wallet.model.js")(
  sequelize,
  DataTypes
);
db.basic_test_submit = require("../models/basic_test_submit.model.js")(
  sequelize,
  DataTypes
);
db.community_tag = require("../models/community_tag.model.js")(
  sequelize,
  DataTypes
);
db.post_tag = require("../models/post_tag.model.js")(
  sequelize,
  DataTypes
);
db.document_tag = require("../models/document_tag.model.js")(
  sequelize,
  DataTypes
);
db.document_access = require("../models/document_access.model.js")(
  sequelize,
  DataTypes
);

// MongoDB models
db.posts = require("../models/post.model.js")(mongoose);



// Communities owner refers to users.id
// db.community.belongsTo(db.user, { foreignKey: "owner" });
// db.user.hasMany(db.community, { foreignKey: "owner" });

// // Community_tags community_id refers to communities.id
// db.community_tag.belongsTo(db.community, { foreignKey: "community_id" });
// db.community.hasMany(db.community_tag, { foreignKey: "community_id" });

// // Community_tags tag_id refers to tags.tag_id
// // db.community_tag.belongsTo(db.tag, { foreignKey: "tag_id" });
// db.tag.hasMany(db.community_tag, { as: "tag_foreign", foreignKey: "tag_id" });

// db.tag.hasMany(db.post_tag, { foreignKey: "tag_id" });
// db.post_tag.belongsTo(db.tag, { foreignKey: "tag_id" });

// // Members community_id refers to communities.id
// db.member.belongsTo(db.community, { foreignKey: "community_id" });
// db.community.hasMany(db.member, { foreignKey: "community_id" });

// // Members user_id refers to users.id
// db.member.belongsTo(db.user, { foreignKey: "user_id" });
// db.user.hasMany(db.member, { foreignKey: "user_id" });

// // Documents community_id refers to communities.id
// db.document.belongsTo(db.community, { foreignKey: "community_id" });
// db.community.hasMany(db.document, { foreignKey: "community_id" });

// // Documents uploaded_by refers to users.id
// db.document.belongsTo(db.user, { foreignKey: "uploaded_by" });
// db.user.hasMany(db.document, { foreignKey: "uploaded_by" });

// // Document_tags document_id refers to documents.id
// db.document_tag.belongsTo(db.document, { foreignKey: "document_id" });
// db.document.hasMany(db.document_tag, {
//   foreignKey: "document_id",
// });

// // Document_tags tag_id refers to tags.tag_id
// db.document_tag.belongsTo(db.tag, { foreignKey: "tag_id" });
// db.tag.hasMany(db.document_tag, {
//   foreignKey: "tag_id",
// });

// // Document_access document_id refers to documents.id
// db.document_access.belongsTo(db.document, { foreignKey: "document_id" });
// db.document.hasMany(db.document_access, {
//   foreignKey: "document_id",
// });

// // Document_access user_id refers to users.id
// db.document_access.belongsTo(db.user, { foreignKey: "user_id" });
// db.user.hasMany(db.document_access, {
//   foreignKey: "user_id",
// });

// // Test created_by refers to users.id
// db.test.belongsTo(db.user, { foreignKey: "created_by" });
// db.user.hasMany(db.test, { foreignKey: "created_by" });

// // Test up_level_request_id refers to up_level_request.id
// db.test.belongsTo(db.up_level_request, { foreignKey: "up_level_request_id" });
// db.up_level_request.hasMany(db.test, { foreignKey: "up_level_request_id" });

// // Level_up_request member_id refers to members.id
// db.up_level_request.belongsTo(db.member, { foreignKey: "member_id" });
// db.member.hasMany(db.up_level_request, { foreignKey: "member_id" });

// // Members current_up_level_request_id refers to up_level_request.id
// db.member.belongsTo(db.up_level_request, {
//   foreignKey: "current_up_level_request_id",
// });
// db.up_level_request.hasOne(db.member, {
//   foreignKey: "current_up_level_request_id",
// });

// // Wallet created_by refers to users.id
// db.wallet.belongsTo(db.user, { foreignKey: "created_by" });
// db.user.hasMany(db.wallet, { foreignKey: "created_by" });

// // Users global_id_active refers to wallet.id
// db.user.belongsTo(db.wallet, { foreignKey: "global_id_active" });
// db.wallet.hasOne(db.user, { foreignKey: "global_id_active" });

// // User_wallet user_id refers to users.id
// db.user_wallet.belongsTo(db.user, { foreignKey: "user_id" });
// db.user.hasMany(db.user_wallet, { foreignKey: "user_id" });

// // User_wallet wallet_id refers to wallet.id
// db.user_wallet.belongsTo(db.wallet, { foreignKey: "wallet_id" });
// db.wallet.hasMany(db.user_wallet, { foreignKey: "wallet_id" });

// // Basic_test community_id refers to communities.id
// db.basic_test.belongsTo(db.community, { foreignKey: "community_id" });
// db.community.hasMany(db.basic_test, { foreignKey: "community_id" });

// // Basic_test_submit user_id refers to users.id
// db.basic_test_submit.belongsTo(db.user, { foreignKey: "user_id" });
// db.user.hasMany(db.basic_test_submit, { foreignKey: "user_id" });

// // Basic_test_submit basic_test_id refers to basic_test.id
// db.basic_test_submit.belongsTo(db.basic_test, { foreignKey: "basic_test_id" });
// db.basic_test.hasMany(db.basic_test_submit, { foreignKey: "basic_test_id" });




// Sync MySQL models
db.sequelize.sync({ force: false })
    .then(() => {
        console.log('MySQL sync done!');
    });

module.exports = db;