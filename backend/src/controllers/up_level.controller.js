require("dotenv").config();

const db = require("../configs/db");
const Member = db.member;
const UpLevelRequest = db.up_level_request;
const Test = db.test;
const User = db.user;

const { formatResponse, STATUS_CODE } = require("../utils/services");
const fs = require("fs");

// Tín ================================================

const getCurrentLevel = async (req, res) => {
    try {
        const member = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
            attributes: ["current_level"],
        });

        return formatResponse(res, member, STATUS_CODE.SUCCESS, "Get current level successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getUpLevelPhase = async (req, res) => {
    try {
        const upLevelPhase = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
            attributes: ["up_level_phase"],
        });

        return formatResponse(res, upLevelPhase, STATUS_CODE.SUCCESS, "Get up level phase successfully!");
    }
    catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
};

const createUpLevelRequest = async (req, res) => {
    try {
        const member = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
        });

        if (member.up_level_phase !== 1) {
            return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "You must be at phase 1 to request up level test!");
        }

        const targetLevel = req.body.target_level;
        const currentLevel = member.current_level;

        console.log(targetLevel, currentLevel);

        if (targetLevel <= currentLevel || targetLevel - currentLevel > 10) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "Target level must > current level and <= current level + 10");
        }

        const upLevelRequest = await UpLevelRequest.create({
            member_id: member.member_id,
            candidate_level: currentLevel,
            candidate_target_level: targetLevel,
        });

        await Member.update({
            current_up_level_request_id: upLevelRequest.up_level_request_id,
            up_level_phase: 2,
        }, {
            where: {
                member_id: member.member_id,
            }
        });

        return formatResponse(
            res, 
            { "up_level_request_id": upLevelRequest.up_level_request_id }, 
            STATUS_CODE.SUCCESS,
             "Create up level request successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getCurrentUpLevelRequestId = async (req, res) => {
    try {
        const member = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
        });

        if (!member.current_up_level_request_id) {
            return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "You don't have any current level request!");
        }

        return formatResponse(res,
            { "up_level_request_id": member.current_up_level_request_id }, 
            STATUS_CODE.SUCCESS,
             "Get current level request successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getTests = async (req, res) => {
    try {
        const tests = await Test.findAll({
            where: {
                up_level_request_id: req.params.up_level_request_id,
            },
        });

        const testsData = await Promise.all(tests.map(async test => {
            const user = await User.findByPk(test.dataValues.created_by);
            const { question_file, answer_file, ...others } = test.dataValues;
            others.created_by = user.full_name;
            return others;
        }));

        const duration = testsData.reduce((sum, test) => sum + test.duration, 0);

        const result = {
            duration: duration,
            tests: testsData,
        }
        return formatResponse(
            res, 
            result, 
            STATUS_CODE.SUCCESS, 
            "Get tests successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const submitAnswer = async (req, res) => {
    try {
        const member = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
        });

        if (member.up_level_phase != 4) {
            return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "You cannot submit answer now!");
        }

        await Member.update({
            up_level_phase: 5,
        }, {
            where: {
                member_id: member.member_id,
            }
        });

        return formatResponse(res, {up_level_phase: 5}, STATUS_CODE.SUCCESS, "Get up level request successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const uploadAnswer = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "File is required!"); 
        }

        const fileData = fs.readFileSync(file.path);


        await Test.update({
            answer_file: fileData,
        }, {
            where: {
                test_id: req.params.test_id,
            }
        });

        fs.unlinkSync(file.path);

        return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Upload answer successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const downloadAnswer = async (req, res) => {
    try {
        const test = await Test.findByPk(req.params.test_id);

        if (!test) {
            return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Test not found!");
        }

        const answer = test.answer_file;
        const fileName = `answer_${test.test_id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        res.send(answer);
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const uploadQuestion = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "File is required!"); 
        }

        const fileData = fs.readFileSync(file.path);

        await Test.update({
            question_file: fileData,
        }, {
            where: {
                test_id: req.params.test_id,
            }
        });

        fs.unlinkSync(file.path);

        return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Upload question successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const downloadQuestion = async (req, res) => {
    try {
        const test = await Test.findByPk(req.params.test_id);

        if (!test) {
            return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Test not found!");
        }

        const question = test.question_file;
        const fileName = `question_${test.test_id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        res.send(question);
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

module.exports = {
    getUpLevelPhase,
    createUpLevelRequest,
    getCurrentUpLevelRequestId,
    getCurrentLevel,
    getTests,
    uploadAnswer,
    submitAnswer,
    downloadAnswer,
    uploadQuestion,
    downloadQuestion,
}

// ===================================================