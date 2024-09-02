const db = require("../configs/db");
const Member = db.member;
const Community = db.community;
const { formatResponse, STATUS_CODE } = require("../utils/services");

const verifyMember = async (req, res, next) => {
  const userInReq = req.user;
  const userId = userInReq.user_id;
  const communityId = req.params.community_id;

  const communityInDb = await Community.findOne({
    where: { community_id: communityId },
  });

  if (communityInDb === null) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.NOT_FOUND,
      "Community does not exist!"
    );
  }

  const memberInDb = await Member.findOne({
    where: { community_id: communityId, user_id: userId },
  });
  if (memberInDb === null) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.FORBIDDEN,
      "User is not a member of this community!"
    );
  }
  const member = memberInDb.dataValues;
  // console.log(member);
  if (!member || member.is_joined === false)
    return formatResponse(
      res,
      {},
      STATUS_CODE.FORBIDDEN,
      "User is not a member of this community!"
    );

  req.member = member;
  next();
};

module.exports = {
  verifyMember,
};
