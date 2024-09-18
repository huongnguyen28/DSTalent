const e = require("express");
const db = require("../configs/db");
const Community = db.community;
const Document = db.document;
const User = db.user;
const Member = db.member;
const { STATUS_CODE, formatResponse } = require("../utils/services");
const { Op, fn, col, Sequelize } = require("sequelize");
const Tag = db.tag;
const Community_Tag = db.community_tag;

const getCommunityList = async (req, res) => {
  try {
    const communities = await Community.findAll({
      attributes: [
        "community_id",
        "name",
        "owner",
        "rating",
        "privacy",
        "cover_image",
        [fn("COUNT", col("members.member_id")), "member_count"],
      ],
      include: [
        {
          model: Member,
          as: "members",
          attributes: [], // We only want to count members, no need to return member data
        },
      ],
      group: ["community.community_id"],
      order: [["createdAt", "DESC"]],
    });

    const communityData = await Promise.all(
      communities.map(async (community) => {
        let status = "Join"; // Default status

        // Check if the current user is the owner
        if (community.owner === req.user.user_id) {
          status = "Owner";
        } else {
          // Check if the user is a member of the community and has joined
          const member = await Member.findOne({
            where: {
              community_id: community.community_id,
              user_id: req.user.user_id,
              is_joined: true,
            },
          });

          if (member) {
            status = "Joined";
          }
        }
        privacy = community.privacy;
        privacy = privacy.charAt(0).toUpperCase() + privacy.slice(1);

        return {
          ...community.get(), // Spread community data
          status, // Add status field
          privacy,
        };
      })
    );

    // Sort the communities based on the custom status order: owner (0), joined (1), not_joined (2)
    const sortedData = communityData.sort((a, b) => {
      const statusOrder = { owner: 0, joined: 1, not_joined: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return formatResponse(
      res,
      { community_list: sortedData },
      STATUS_CODE.SUCCESS,
      "Success!"
    );
  } catch (err) {
    console.log(err.message);
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      err.message
    );
  }
};

const createCommunity = async (req, res) => {
  try {
    const { name, description, privacy, tags, cover_image } = req.body;

    const tagsToCreate = [];

    for (const tag of tags) {
      const [existingTag, created] = await Tag.findOrCreate({
        where: { tag_name: tag },
        defaults: { tag_name: tag },
      });
      tagsToCreate.push(existingTag);
    }

    const newCommunity = await Community.create({
      name,
      description,
      privacy,
      cover_image,
      owner: req.user.user_id,
      member_count: 1,
      rating: 0,
      contact_email: req.user.email,
      contact_phone: req.user.phone,
    });

    const tag_arr_id = tagsToCreate.map((tag) => tag.tag_id);
    const communityTagsToCreate = tag_arr_id.map((tagId) => ({
      community_id: newCommunity.community_id,
      tag_id: tagId,
    }));

    await Community_Tag.bulkCreate(communityTagsToCreate, {
      ignoreDuplicates: true,
    });

    await Member.create({
      community_id: newCommunity.community_id,
      user_id: req.user.user_id,
      is_joined: true,
      is_admin: true,
    });

    return formatResponse(
      res,
      {
        community_id: newCommunity.community_id,
        name: newCommunity.name,
        description: newCommunity.description,
        privacy: newCommunity.privacy,
        tags: tags,
        cover_image: newCommunity.cover_image,
        member_count: newCommunity.member_count,
        rating: newCommunity.rating,
        contact_phone: newCommunity.contact_phone,
        contact_email: newCommunity.contact_email,
      },
      STATUS_CODE.CREATED,
      "Create community successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create community!"
    );
  }
};

const updateCommunity = async (req, res) => {
  try {
    const communityId = req.params.community_id;

    const existingCommunity = await Community.findOne({
      where: { community_id: communityId },
    });

    const {
      name,
      description,
      privacy,
      tags,
      cover_image,
      contact_email,
      contact_phone,
    } = req.body;
    let modifed_tags = false;

    if (typeof tags !== "undefined") {
      modifed_tags = true;

      await Community_Tag.destroy({ where: { community_id: communityId } });

      const tagsToCreate = [];

      for (const tag of tags) {
        const [existingTag, created] = await Tag.findOrCreate({
          where: { tag_name: tag },
          defaults: { tag_name: tag },
        });
        tagsToCreate.push(existingTag);
      }

      const tag_arr_id = tagsToCreate.map((tag) => tag.tag_id);

      const communityTagsToCreate = tag_arr_id.map((tagId) => ({
        community_id: communityId,
        tag_id: tagId,
      }));

      await Community_Tag.bulkCreate(communityTagsToCreate, {
        ignoreDuplicates: true,
      });
    }

    function hasChanges(newData, oldData) {
      return Object.keys(newData).some(key => 
        newData[key] !== undefined && newData[key] !== oldData[key]
      );
    } 

    const changes = {
      name,
      description,
      privacy,
      cover_image,
      contact_email,
      contact_phone
    }
    
    if(!hasChanges(changes, existingCommunity) && !modifed_tags) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_MODIFIED,
        "No changes was made!"
      );
    }

    if(hasChanges(changes, existingCommunity)) {
      await Community.update(
        changes,
        {
          where: { community_id: communityId }
        }
      );
    }

    return formatResponse(
      res,
      {
        name,
        description,
        privacy,
        tags,
        cover_image,
        contact_email,
        contact_phone,
      },
      STATUS_CODE.SUCCESS,
      "Community updated successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to update community!"
    );
  }
};

const deleteCommunity = async (req, res) => {
  try {
    const communityId = req.params.community_id;
    await Community.update(
      { is_active: false },
      {
        where: { community_id: communityId },
      }
    );
    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Community deleted successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to delete community!"
    );
  }
};

const searchCommunity = async (req, res) => {
  try {
    const userID = req.user.user_id;
    const { query, page = 1, limit = 20, sort, is_default } = req.query;

    const tags = Array.isArray(req.query.tags)
      ? req.query.tags
      : req.query.tags
      ? req.query.tags.split(",")
      : [];

    const offset = (Number(page) - 1) * limit;
    const attributes = {
      include: [
        [Sequelize.literal(`owner = ${userID}`), "is_owner"],
        [
          Sequelize.literal(
            `EXISTS(SELECT 1 FROM member WHERE member.community_id = community.community_id AND member.user_id = ${userID} AND member.is_joined = true)`
          ),
          "is_joined",
        ],
      ],
      exclude: ["is_active", "updatedAt", "community_id"],
    };
    const include = [
      {
        model: Member,
        required: false,
        where: { user_id: userID },
        attributes: [],
      },
    ];

    let communities;

    if (is_default === "1") {
      communities = await Community.findAndCountAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { privacy: "public" }, 
                { owner: userID }, 
                Sequelize.literal(
                  `EXISTS(SELECT 1 FROM member WHERE member.community_id = community.community_id AND member.user_id = ${userID} AND member.is_joined = true)`
                )
              ],
            },
            {
              is_active: true,
            },
          ],
        },
        offset,
        limit: Number(limit),
        include,
        attributes,
        order: [
          [
            Sequelize.literal(`CASE WHEN owner = ${userID} THEN 0 ELSE 1 END`),
            "ASC",
          ],
          [
            Sequelize.literal(
              `CASE WHEN owner = ${userID} THEN privacy ELSE NULL END`
            ),
            "DESC",
          ],
          [
            Sequelize.literal(
              `CASE WHEN owner != ${userID} THEN EXISTS(SELECT 1 FROM member WHERE member.community_id = community.community_id AND member.user_id = ${userID} AND member.is_joined = true)
              ELSE NULL END`
            ),
            "DESC",
          ],
          [`rating`, "DESC"],
        ],
      });
    } else {
      let wheres = {};
      let order = [];
      let having;
      let group;
      let include2 = [];
      if (query) {
        wheres.name = {
          [Op.like]: `%${query}%`,
        };
      }
      if (sort) {
        order = [sort.split(",")];
      }
      if (tags.length > 0) {
        let tagsCount = tags.length;
        include2.push({
          model: Community_Tag,
          required: true,
          attributes: [],
          include: [
            {
              model: Tag,
              required: true,
              where: {
                tag_name: {
                  [Op.in]: tags,
                },
              },
              attributes: [],
            },
          ],
        });
        group = ["community.community_id"];
        having = Sequelize.where(
          Sequelize.fn(
            "COUNT",
            Sequelize.fn(
              "DISTINCT",
              Sequelize.col("community_tags->tag.tag_name")
            )
          ),
          "=",
          tagsCount
        );
      }
      communities = await Community.findAll({
        include: include2,
        group,
        having,
      });

      const communityIds = communities.map(
        (community) => community.community_id
      );

      communities = await Community.findAndCountAll({
        where: {
          [Op.and]: [
            {
              community_id: {
                [Op.in]: communityIds,
              },
            },
            wheres,
            {
              [Op.and]: [
                {
                  [Op.or]: [
                    { privacy: "public" }, 
                    { owner: userID }, 
                    Sequelize.literal(
                      `EXISTS(SELECT 1 FROM member WHERE member.community_id = community.community_id AND member.user_id = ${userID} AND member.is_joined = true)`
                    )
                  ],
                },
                {
                  is_active: true,
                },
              ],
            },
          ],
        },
        offset,
        limit: Number(limit),
        include,
        attributes,
        order,
      });
    }

    const totalPage = Math.ceil(communities.count / limit);
    if (page > totalPage) {
      return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Page not found!");
    }
    const pagination = {
      currentPage: Number(page),
      pageSize: Number(limit),
      totalPage: totalPage,
      hasNext: page < totalPage,
    };
    
    const data = {
      communities: communities.rows.map(community => {
        const { owner, ...otherAttributes } = community.get({ plain: true });
        return otherAttributes;
      }),
      pagination,
    };
    return formatResponse(
      res,
      data,
      STATUS_CODE.SUCCESS,
      "Get community list successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to search community!"
    );
  }
};

const getCommunityDetail = async (req, res) => {
  const communityId = req.params.community_id;
  const userId = req.user.user_id;
  const community = await Community.findOne({
    where: { community_id: communityId },
    attributes: {
      exclude: ["owner"], // Exclude owner field to prevent sensitive information
    },
  });

  if (!community || !community.is_active) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Community not found!"
    );
  }

  const isJoined = await Member.findOne({
    where: { community_id: communityId, user_id: userId },
    attributes: ["is_joined"],
  });
  community.dataValues.is_joined = isJoined ? isJoined.is_joined : false;

  return formatResponse(
    res,
    community,
    STATUS_CODE.SUCCESS,
    "Get detail successfully!"
  );
};

// response body:
// member_id, user_id, is_joined, current_level, description, full_name, avatar
const getCommunityMembers = async (req, res) => {
  // user must be a member of the community to get the list of members
  const communityId = req.params.community_id;
  const page = req.query.page || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const sort = req.query.sort || "full_name";
  const order = req.query.order || "ASC";
  const search = req.query.search || "";
  const communityMembers = await Member.findAll({
    attributes: ["member_id", "user_id", "current_level", "description"],
    include: [
      {
        model: User,
        attributes: ["full_name", "avatar"],
        where: {
          full_name: {
            [Op.like]: "%" + search + "%", // matches anything that contains the search string
          },
        },
      },
    ],
    where: { community_id: communityId, is_joined: true },
    order: [[{ model: User }, sort, order]],
    limit: limit,
    offset: offset, // offset for pagination
  });
  return formatResponse(
    res,
    communityMembers,
    STATUS_CODE.SUCCESS,
    "Get community members successfully!"
  );
};

const getCommunityAdmins = async (req, res) => {
  
  const communityId = req.params.community_id;

  const communityAdmins = await Member.findAll({
    where: { community_id: communityId, is_admin: true },
    include: [
      {
        model: User, 
        attributes: ['user_id', 'full_name', 'avatar'], 
      },
    ],
  });
  
  const result = communityAdmins.map(admin => ({
    user_id: admin.user_id,
    full_name: admin.user.full_name,
    avatar: admin.user.avatar,
  }));
  
  return formatResponse(
    res,
    result,
    STATUS_CODE.SUCCESS,
    "Get community admins successfully!"
  );
};

const joinCommunity = async (req, res) => {
  const userInReq = req.user;
  const userId = userInReq.user_id;
  const communityId = req.params.community_id;
  const member = await Member.findOne({
    where: { community_id: communityId, user_id: userId },
  });
  let newMember = null;
  if (member && member.is_joined === true) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.BAD_REQUEST,
      "User is already a member of this community!"
    );
  } else if (member && member.dataValues.is_joined === false) {
    newMember = await Member.update(
      { is_joined: true },
      {
        where: { member_id: member.dataValues.member_id },
      }
    );
    newMember = await Member.findOne({
      where: { member_id: member.dataValues.member_id },
    });
  } else {
    const userInDb = await User.findOne({
      attributes: ["user_id"],
      where: { user_id: userInReq.user_id },
    });
    const communityInDb = await Community.findOne({
      attributes: ["community_id"],
      where: { community_id: communityId },
    });
    if (!userInDb || !communityInDb)
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "User or Community not found!"
      );

    newMember = await Member.create({
      community_id: communityId,
      user_id: userId,
      is_joined: true,
    });
  }
  await Community.update(
    { member_count: Sequelize.literal("member_count + 1") },
    {
      where: { community_id: communityId },
    }
  );
  return formatResponse(
    res,
    newMember,
    STATUS_CODE.CREATED,
    "User joined community successfully!"
  );
};

const leaveCommunity = async (req, res) => {
  const userInReq = req.user;
  const userId = userInReq.user_id;
  const communityId = req.params.community_id;
  const member = await Member.findOne({
    where: { community_id: communityId, user_id: userId },
  });
  if (!member || member.is_joined === false)
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "User is not a member of this community!"
    );
  if (member.is_admin) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.FORBIDDEN,
      "Admin cannot leave the community!"
    );
  }
  const updatedMember = await Member.update(
    { is_joined: false },
    {
      where: { community_id: communityId, user_id: userId },
    }
  );

  await Community.update(
    { member_count: Sequelize.literal("member_count - 1") },
    {
      where: { community_id: communityId },
    }
  );

  return formatResponse(
    res,
    updatedMember,
    STATUS_CODE.SUCCESS,
    "User left community successfully!"
  );
};

const getMemberProfile = async (req, res) => {
  const memberId = req.member.member_id;
  const member = await Member.findOne({
    where: {
      member_id: memberId,
    },
    attributes: [
      "member_id",
      "user_id",
      "is_joined",
      "current_level",
      "description",
    ],
  });
  return formatResponse(
    res,
    member,
    STATUS_CODE.SUCCESS,
    "Get member profile successfully!"
  );
};

const updateMemberProfile = async (req, res) => {
  const description = req.body.description;
  const member = req.member;
  if (!member || member.member_id != req.params.member_id) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.UNAUTHORIZED,
      "Cannot update other member's profile"
    );
  }
  const updatedMember = await Member.update(
    { description: description },
    {
      where: { member_id: req.params.member_id },
    }
  );
  return formatResponse(
    res,
    updatedMember,
    STATUS_CODE.SUCCESS,
    "Update member profile success!"
  );
};
const grantRoleInCommunity = async (req, res) => {
  try {
    const communityId = req.params.community_id;
    const memberId = req.params.member_id;

    const member = await Member.findOne({
      where: {
        community_id: communityId,
        user_id: memberId,
      },
    });

    if (!member) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Member not found in the community!"
      );
    }

    if (member.is_admin) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Member is already an admin!"
      );
    }

    await Member.update(
      { is_admin: true },
      { where: { community_id: communityId, user_id: memberId } }
    );

    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Role granted successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to grant role!"
    );
  }
};

const revokeRoleInCommunity = async (req, res) => {
  try {
    const communityId = req.params.community_id;
    const memberId = req.params.member_id;

    const member = await Member.findOne({
      where: {
        community_id: communityId,
        user_id: memberId,
      },
    });

    if (!member) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Member not found in the community!"
      );
    }

    if (!member.is_admin) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.BAD_REQUEST,
        "Member is not an admin!"
      );
    }

    await Member.update(
      { is_admin: false },
      { where: { community_id: communityId, user_id: memberId } }
    );

    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Role revoked successfully!"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to revoke role!"
    );
  }
};

// rate community by member

module.exports = {
  getCommunityList,
  createCommunity,
  getCommunityDetail,
  getCommunityMembers,
  joinCommunity,
  leaveCommunity,
  getMemberProfile,
  updateMemberProfile,
  updateCommunity,
  deleteCommunity,
  searchCommunity,
  grantRoleInCommunity,
  revokeRoleInCommunity,
  getCommunityAdmins,
};
