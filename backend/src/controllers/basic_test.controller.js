const { removeTicks } = require("sequelize/lib/utils");
const db = require("../configs/db");
const { STATUS_CODE, formatResponse } = require("../utils/services");
const BasicTest = db.basic_test;
const Community = db.community;
const User = db.user;

// Fetch a random basic test for a community
const getRandomBasicTest = async (req, res) => {
  try {
    const { community_id } = req.params;

    // Fetch all basic tests for the community
    const basicTests = await BasicTest.findAll({
      where: { community_id: community_id },
      // include: [
      //   {
      //     model: Community,
      //     // as: "community",
      //     attributes: ["community_id", "name"],
      //   },
      //   {
      //     model: User,
      //     // as: "created_by",
      //     attributes: ["user_id", "full_name"],
      //   },
      // ],
    });

    // Return error if no basic tests are found
    if (!basicTests || basicTests.length === 0) {
      return formatResponse(
        res,
        {},
        STATUS_CODE.NOT_FOUND,
        "No basic tests found for the community",
      );  
    }

    // Randomly select a basic test
    const randomTest = basicTests[Math.floor(Math.random() * basicTests.length)];

    // Send response
    return formatResponse(
      res,
      {
        id: randomTest.basic_test_id,
        content: randomTest.content,
        // created_by: {
        //   id: randomTest.created_by.id,
        //   name: randomTest.created_by.name,
        // },
        // community: {
        //   id: randomTest.community.id,
        //   name: randomTest.community.name,
        // },
      },
      STATUS_CODE.SUCCESS,
      "Successfully fetched random basic test",
    )
  } catch (error) {
    return formatResponse(
      res,
      {},
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      error.message,
    );
  }
};

const createBasicTest = async (req, res) => {
  try {
    const { community_id } = req.params;
    const { content } = req.body; // Content of the basic test

    // Check if the community exists
    const community = await Community.findByPk(community_id);
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
      community_id: community_id,
      content,
    });

    // Return success response
    return formatResponse(
      res,
      {
        id: newBasicTest.basic_test_id,
        content: newBasicTest.content,
        // created_by: {
        //   id: randomTest.created_by.id,
        //   name: randomTest.created_by.name,
        // },
        // community: {
        //   id: community_id,
        //   name: community.name,
        // },
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
    const basicTest = await BasicTest.findByPk(basic_test_id
    //   , {
    //   include: [
    //     {
    //       model: Community,
    //       attributes: ["community_id", "name"],
    //     },
    //     {
    //       model: User,
    //       attributes: ["user_id", "full_name"],
    //     },
    //   ],
    // }
  );

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


module.exports = {
  getRandomBasicTest,
  createBasicTest,
  deleteBasicTest
};
