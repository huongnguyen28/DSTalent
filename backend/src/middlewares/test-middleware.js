const db = require("../configs/db");
const Member = db.member;
const Community = db.community;
const Test = db.test;
const UpLevelRequest = db.up_level_request;
const { formatResponse, STATUS_CODE } = require("../utils/services");

const isCandidateOfTest = async (req, res, next) => {
    const test = await Test.findByPk(req.params.test_id);
    const upLevelRequest = await UpLevelRequest.findByPk(test.up_level_request_id);
    const member = await Member.findByPk(upLevelRequest.member_id);
    if (member.user_id !== user.user_id) {
        return formatResponse(
            res,
            {},
            STATUS_CODE.FORBIDDEN,
            "User is not a candidate of this test!"
        );
    }
    next();
};

const isJudgeOfTest = async (req, res, next) => {
    const user = req.user;
    const test = await Test.findByPk(req.params.test_id);
    if (test.created_by !== user.user_id) {
        return formatResponse(
            res,
            {},
            STATUS_CODE.FORBIDDEN,
            "User is not a judge of this test!"
        );
    }
    next();
}

const isCandiateOrJudgeOfTest = async (req, res, next) => {
    const user = req.user;
    console.log(user);
    const test = await Test.findByPk(req.params.test_id);
    if (test.created_by !== user.user_id) {
        const upLevelRequest = await UpLevelRequest.findByPk(test.up_level_request_id);
        const member = await Member.findByPk(upLevelRequest.member_id);
        if (member.user_id !== user.user_id) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.FORBIDDEN,
                "User is not a candidate or judge of this test!"
            );
        }
    }
    next();
};

module.exports = {
    isCandidateOfTest,
    isJudgeOfTest,
    isCandiateOrJudgeOfTest,
};
