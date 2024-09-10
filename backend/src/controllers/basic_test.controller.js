const { removeTicks } = require("sequelize/lib/utils");
const db = require("../configs/db");
const { STATUS_CODE, formatResponse } = require("../utils/services");
const { get } = require("http");
const BasicTest = db.basic_test;
const BasicTestSubmit = db.basic_test_submit;
const Community = db.community;
const User = db.user;

// Fetch a random basic test for a community
const getRandomBasicTest = async (req, res) => {
  try {
    const { community_id } = req.params;

    // Fetch all basic tests for the community
    const basicTests = await BasicTest.findAll({
      where: { community_id: community_id },
    });

    // Return error if no basic tests are found
    if (!basicTests || basicTests.length === 0) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "No basic tests found for the community"
      );
    }

    // Randomly select a basic test
    const randomTest =
      basicTests[Math.floor(Math.random() * basicTests.length)];

    // Send response
    return formatResponse(
      res,
      {
        basic_test_id: randomTest.basic_test_id,
        description: randomTest.description,
        content: randomTest.content,
      },
      STATUS_CODE.SUCCESS,
      "Successfully fetched random basic test"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

// Get all basic tests for a community
// Only admins can view all basic tests
// Members can only view random basic tests
const getBasicTests = async (req, res) => {
  try {
    const communityId = req.params.community_id;

    // fetch all basic tests for the community
    const basicTests = await BasicTest.findAll({
      attributes: { exclude: ["content"] },
      where: { community_id: communityId },
    });

    return formatResponse(
      res,
      basicTests,
      STATUS_CODE.SUCCESS,
      "Successfully fetched basic tests"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const createBasicTest = async (req, res) => {
  try {
    const communityId = Number(req.params.community_id);
    const { description, content } = req.body; // Content of the basic test

    // Check if the community exists
    const community = await Community.findByPk(communityId);
    if (!community) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Community not found"
      );
    }

    // Create a new basic test
    const newBasicTest = await BasicTest.create({
      community_id: communityId,
      description,
      content,
    });

    // Return success response
    return formatResponse(
      res,
      {
        basic_test_id: newBasicTest.basic_test_id,
        community_id: newBasicTest.community_id,
        description: newBasicTest.description,
        content: newBasicTest.content,
      },
      STATUS_CODE.SUCCESS,
      "Basic test uploaded successfully"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const deleteBasicTest = async (req, res) => {
  try {
    const { basic_test_id } = req.params; // Get the test ID from request parameters

    // Find the basic test by its ID
    const basicTest = await BasicTest.findByPk(basic_test_id);

    // Check if the basic test exists
    if (!basicTest) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Basic test not found"
      );
    }

    // Delete the basic test
    await BasicTest.destroy({
      where: { basic_test_id: basic_test_id },
    });

    // Return success response
    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Basic test deleted successfully"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const submitBasicTest = async (req, res) => {
  try {
    const { basic_test_id, community_id } = req.params; // Get the test ID from request parameters
    const { user_id } = req.user; // Get the user ID from the request
    const { content, score } = req.body; // Get the submission content

    // Find the basic test by its ID
    const basicTest = await BasicTest.findByPk(basic_test_id);

    // Check if the basic test exists
    if (!basicTest) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Basic test not found"
      );
    }

    // if user has already submitted the test
    // then override the previous submission
    const previousBasicTestSubmit = await BasicTestSubmit.findOne({
      where: { basic_test_id: basic_test_id, user_id: user_id },
    });

    if (previousBasicTestSubmit) {
      // Delete the previous submission
      await BasicTestSubmit.destroy({
        where: { basic_test_id: basic_test_id, user_id: user_id },
      });
    }

    // Submit the basic test
    await BasicTestSubmit.create({
      basic_test_id: basic_test_id,
      user_id: user_id,
      content: content,
      score: score,
      created_at: Date.now(),
    });

    // Return success response
    return formatResponse(
      res,
      {},
      STATUS_CODE.CREATED,
      "Basic test submitted successfully"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const getBasicTestSubmissions = async (req, res) => {
  try {
    const communityId = req.params.community_id;
    const isAdmin = req.member.is_admin;
    const userId = req.user.user_id;
    const whereCondition = {
      community_id: communityId,
    };

    if (!isAdmin) {
      whereCondition.user_id = userId;
    }
    // Member can only view their own submissions
    const memberSubmissions = await BasicTestSubmit.findAll({
      include: [
        {
          model: BasicTest,
          attributes: [], // This will prevent including BasicTest attributes in the final result
          where: {
            basic_test_id: Sequelize.col("BasicTestSubmit.basic_test_id"),
          },
        },
      ],
      where: whereCondition,
    });
    return formatResponse(
      res,
      memberSubmissions,
      STATUS_CODE.SUCCESS,
      "Successfully fetched basic test submissions"
    );
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

const updateBasicTest = async (req, res) => {
  try {
    const basicTestId = req.params.basic_test_id;
    const { description, content } = req.body;

    const existingBasicTest = await BasicTest.findByPk(basicTestId);

    await BasicTest.update(
      {
        description: description || existingBasicTest.description,
        content: content || existingBasicTest.content,
      },
      { where: { basic_test_id: basicTestId } }
    );

    return formatResponse(
      res,
      {},
      STATUS_CODE.SUCCESS,
      "Basic test updated successfully"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Error updating basic test"
    );
  }
};

const getABasicTest = async (req, res) => {
  try {
    const basicTestId = req.params.basic_test_id;

    const basicTest = await BasicTest.findByPk(basicTestId);

    if (!basicTest) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "Basic test not found"
      );
    }

    return formatResponse(
      res,
      basicTest,
      STATUS_CODE.SUCCESS,
      "Successfully fetched basic test"
    );
  } catch (error) {
    return formatResponse(
      res,
      error,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Error fetching basic test"
    );
  }
};

module.exports = {
  getRandomBasicTest,
  createBasicTest,
  getBasicTests,
  deleteBasicTest,
  submitBasicTest,
  getBasicTestSubmissions,
  updateBasicTest,
  getABasicTest,
};
