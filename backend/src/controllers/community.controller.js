const db = require("../configs/db");
const Community = db.community;
const User = db.user;
const Member = db.member;
const { STATUS_CODE, formatResponse } = require("../utils/services");
const { Op } = require("sequelize");
const Tag = db.tag;
const Community_Tag = db.community_tag;


const getCommunityList = async (req, res) => {
  const communities = await Community.findAll({
    attributes: ["community_id", "name", "owner"],
    order: [["createdAt"]],
  });
  const owner_communities = communities.filter(
    (community) => community.owner === req.user.user_id
  );
  const not_owner_communities = communities.filter(
    (community) => community.owner !== req.user.user_id
  );

  const data = [...owner_communities, ...not_owner_communities];

  return formatResponse(res, data, STATUS_CODE.SUCCESS, "Success!");
};

const createCommunity = async (req, res) => {
  try {
    const {name, description, privacy, tags, cover_image} = req.body;

    const tagsToCreate = [];
    const tag_arr = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOne({ where: { tag_name: tag } });
      if (!existingTag) {
        tagsToCreate.push({ tag_name: tag });
      } else {
        tag_arr.push(existingTag);
      }
    }

    await Tag.bulkCreate(tagsToCreate, {
      ignoreDuplicates: true
    });

    const newCommunity = await Community.create({
      name,
      description,
      privacy,
      cover_image,
      owner: req.user.user_id,
      member_count: 1,
      rating: 0,
      contact_email: req.user.email,
      contact_phone: req.user.phone
    });

    const new_tag_arr = await Tag.findAll({ where: { tag_name: tagsToCreate.map(tag => tag.tag_name) } });
    tag_arr.push(...new_tag_arr);
    const tag_arr_id = tag_arr.map(tag => tag.tag_id);
    const communityTagsToCreate = tag_arr_id.map(tagId => ({
      community_id: newCommunity.community_id,
      tag_id: tagId
    }));

    await Community_Tag.bulkCreate(communityTagsToCreate, {
      ignoreDuplicates: true
    });
    
    await Member.create({
      community_id: newCommunity.community_id,
      user_id: req.user.user_id,
      is_joined: true,
      is_admin: true
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
        contact_email: newCommunity.contact_email
      },
      STATUS_CODE.CREATED,
      "Create community successfully!"
    );
  } catch(error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create community!"
    );
  }
};

const updateCommunity = async (req, res) => {
  const communityId = req.params.community_id;

  const existingCommunity = await Community.findOne(
    {
      where: { community_id: communityId }
    }
  );

  const { name, description, privacy, tags, cover_image } = req.body;
  let modifed_tags = false;

  if (typeof tags !== 'undefined') {
    modifed_tags = true;
    await Community_Tag.destroy({ where: { community_id: communityId } });
    const tagsToCreate = [];
    const tag_arr = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOne({ where: { tag_name: tag } });
      if (!existingTag) {
        tagsToCreate.push({ tag_name: tag });
      } else {
        tag_arr.push(existingTag);
      }
    }

    await Tag.bulkCreate(tagsToCreate, {
      ignoreDuplicates: true
    });

    const new_tag_arr = await Tag.findAll({ where: { tag_name: tagsToCreate.map(tag => tag.tag_name) } });
    tag_arr.push(...new_tag_arr);
    const tag_arr_id = tag_arr.map(tag => tag.tag_id);
    const communityTagsToCreate = tag_arr_id.map(tagId => ({
      community_id: communityId,
      tag_id: tagId
    }));

    await Community_Tag.bulkCreate(communityTagsToCreate, {
      ignoreDuplicates: true
    }); 
  }

  const updatedCommunity = await Community.update(
    {
      name: name || existingCommunity.name,
      description: description || existingCommunity.description,
      privacy: privacy || existingCommunity.privacy,
      cover_image: cover_image || existingCommunity.cover_image,
    },
    {
      where: { community_id: communityId },
    }
  );

  if (updatedCommunity[0] === 0 && !modifed_tags) { 
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
      community_id: communityId,
      name: name || existingCommunity.name,
      description: description || existingCommunity.description,
      privacy: privacy || existingCommunity.privacy,
      tags: tags,
      cover_image: cover_image || existingCommunity.cover_image,
      member_count: existingCommunity.member_count,
      rating: existingCommunity.rating,
      contact_phone: existingCommunity.contact_phone,
      contact_email: existingCommunity.contact_email
    },
    STATUS_CODE.SUCCESS,
    "Community updated successfully!"
  );
};

const deleteCommunity = async (req, res) => {
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
  
  if(!community || !community.is_active) {
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
  const limit = req.query.limit || 10;
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
  const updatedMember = await Member.update(
    { is_joined: false },
    {
      where: { community_id: communityId, user_id: userId },
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
  if (!member || member.member_id !== req.params.member_id) {
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
  deleteCommunity
};
