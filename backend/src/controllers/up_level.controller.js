require("dotenv").config();

const { or, Op } = require("sequelize");
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

const getCurrentTests = async (req, res) => {
    try {
        const member = await Member.findOne({
            where: {
                user_id: req.user.user_id,
                community_id: req.params.community_id
            },
        });

        const upLevelRequest = await UpLevelRequest.findOne({
            where: {
                up_level_request_id: member.current_up_level_request_id,
            }
        });

        const tests = await Test.findAll({
            where: {
                up_level_request_id: upLevelRequest.up_level_request_id,
            },
        });

        const testsData = await Promise.all(tests.map(async test => {
            const user = await User.findByPk(test.dataValues.created_by);
            const { question_file, answer_file, ...others } = test.dataValues;
            others.created_by = user.full_name;
            return others;
        }));

        const duration = testsData.reduce((sum, test) => sum + test.duration, 0);
        const score = testsData.reduce((sum, test) => sum + test.score, 0);

        const result = {
            duration: duration,
            score: score,
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
        const test = await Test.findByPk(req.params.test_id);
        if (test.question_file) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "Question has already been uploaded!");
        }

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

        await UpLevelRequest.update({
            num_judge_completed_question: db.sequelize.literal('num_judge_completed_question + 1')
        }, {
            where: {
                up_level_request_id: test.up_level_request_id
            }
        });

        const up_level_request = await UpLevelRequest.findByPk(test.up_level_request_id);

        if (up_level_request.num_judge_completed_question == 3) {
            await Member.update({
                up_level_phase: 4,
            }, {
                where: {
                    current_up_level_request_id: up_level_request.up_level_request_id
                }
            });
        }

        fs.unlinkSync(file.path);

        return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Upload question successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
}

const updateQuestion = async (req, res) => {
    try {
        const test = await Test.findByPk(req.params.test_id);
        if (!test) {
            return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Test not found!");
        }

        if (!test.question_file) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "Question has not been uploaded!");
        }

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

        return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Update question successfully!");
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

// That the requester is qualifed to be the judge
const listLevelUpRequests = async (req, res) => {
    try {
        const requesterId = req.member.member_id;
        const requeterLevel = await Member.findOne({
            where: {
                member_id: requesterId
            },
            attributes: ["current_level"]
        });

        const listLevelUpRequest = await UpLevelRequest.findAll({
            where: {
                [Op.and]: [
                    {
                        candidate_target_level: {
                            [Op.lte]: requeterLevel.current_level - 5
                        },
                    },
                    {
                        num_judge_agreed: {
                            [Op.lt]: 3
                        }
                    }
                ]
            },
            order: [
                ["candidate_target_level", "DESC"],
                ["num_judge_agreed", "DESC"],
                ["created_at", "ASC"] 
            ],
            attributes: ["up_level_request_id", "candidate_level", "candidate_target_level", "num_judge_agreed", "created_at"],
        });

        return formatResponse(
            res,
            listLevelUpRequest,
            STATUS_CODE.SUCCESS,
            "List level up request successfully!"
        );
    } catch(error) {
        return formatResponse(
            res,
            error,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            "Error while listing level up request"
        );
    }
};

const agreedToJudge = async (req, res) => {
    try {
        const requesterId = req.member.member_id;
        const upLevelRequestId = req.params.up_level_request_id;
        const upLevelRequest = await UpLevelRequest.findByPk(upLevelRequestId);

        if (!upLevelRequest) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Up level request not found!"
            );
        }

        const requeterLevel = await Member.findOne({
            where: {
                member_id: requesterId
            },
            attributes: ["current_level"]
        });

        if (upLevelRequest.candidate_target_level > requeterLevel.current_level - 5) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.FORBIDDEN,
                "You are not qualified to be the judge of this request!"
            );
        }

        if (upLevelRequest.num_judge_agreed == 3) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.FORBIDDEN,
                "This request has enough judges!"
            );
        }

        await UpLevelRequest.update({
            num_judge_agreed: upLevelRequest.num_judge_agreed + 1
        }, {
            where: {
                up_level_request_id: upLevelRequestId
            }
        });

        const test = await Test.create({
            up_level_request_id: upLevelRequestId,
            created_by: requesterId,
        });

        return formatResponse(
            res,
            {
                "test_id": test.test_id,
                "createdAt": test.createdAt
            },
            STATUS_CODE.SUCCESS,
            "Agreed to judge successfully!"
        );
    } catch(error) {
        return formatResponse(
            res,
            error,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            "Error while agreeing to judge"
        );
    }
};

const uploadScore = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const testId = req.params.test_id;

        const test = await Test.findOne({ where: { test_id: testId } });

        if (!test || test.created_by !== userId) {
            return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "You are not authorized to upload score for this test.");
        }

        const { score } = req.body; 

        if (score === undefined || isNaN(score)) {
            return formatResponse(res, {}, STATUS_CODE.BAD_REQUEST, "Score is required and must be a number!");
        }

        await Test.update(
            { score: parseFloat(score) }, 
            { where: { test_id: testId } }
        );

        return formatResponse(res, {}, STATUS_CODE.SUCCESS, "Upload score successfully!");
    } catch (error) {
        return formatResponse(res, {}, STATUS_CODE.INTERNAL_SERVER_ERROR, error.message);
    }
};

const listPendingForJudge = async (req, res) => {
    try {
      const userId = req.user.user_id; 
      const communityId = req.params.community_id;
  
      const pendingForJudgeTests = await Test.findAll({
        include: [
          {
            model: UpLevelRequest, 
            required: true, 
            include: [
              {
                model: Member, 
                required: true, 
                where: { community_id: communityId }, 
              }
            ]
          }
        ],
        where: {
          created_by: userId,
          question_file: { [Op.not]: null },
          answer_file: { [Op.not]: null }, // Không rỗng
          score: { [Op.or]: [0, null] },
        }
      });
  
      return formatResponse(
        res,
        pendingForJudgeTests,
        STATUS_CODE.SUCCESS,
        "List of tests pending for judge retrieved successfully."
      );
    } catch (error) {
      return formatResponse(
        res,
        error,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to retrieve pending tests for judge."
      );
    }
  };

  const listPendingForTest = async (req, res) => {
    try {
      const userId = req.user.user_id; 
      const communityId = req.params.community_id;
 
      const pendingForTestTests = await Test.findAll({
        include: [
          {
            model: UpLevelRequest, 
            required: true, 
            include: [
              {
                model: Member, 
                required: true, 
                where: { community_id: communityId }, 
              }
            ]
          }
        ],
        where: {
          created_by: userId,
          question_file: null
        }
      });
  
      return formatResponse(
        res,
        pendingForTestTests,
        STATUS_CODE.SUCCESS,
        "List of tests pending for test retrieved successfully."
      );
    } catch (error) {
      return formatResponse(
        res,
        error,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to retrieve pending tests for test."
      );
    }
  };

module.exports = {
    getUpLevelPhase,
    createUpLevelRequest,
    getCurrentLevel,
    getCurrentTests,
    uploadAnswer,
    submitAnswer,
    downloadAnswer,
    uploadQuestion,
    downloadQuestion,
    listLevelUpRequests,
    agreedToJudge,
    updateQuestion,
    uploadScore,
    listPendingForJudge,
    listPendingForTest,
}

// ===================================================