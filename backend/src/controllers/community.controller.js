const db = require("../configs/db");
const Community = db.community;
const Tag = db.tag;
const Community_Tag = db.community_tag;


const getCommunityList = async (req, res) => {
    const communities = await Community.findAll({ attributes: ['community_id', 'name', 'owner'], order: [['createdAt']]});
    const owner_communities = communities.filter(community => community.owner === req.user.user_id);
    const not_owner_communities = communities.filter(community => community.owner !== req.user.user_id);

    const data = [...owner_communities, ...not_owner_communities];

    return res.status(200).json({
        data: data,
        status: 200,
        message: "Success!"
    });
};

const createCommunity = async (req, res) => {
    try {
        const {name, description, privacy, tags, cover_image} = req.body;

        const tagsToCreate = [];
        for (const tag of tags) {
            const existingTag = await Tag.findOne({ where: { tag_name: tag } });
            if (!existingTag) {
                tagsToCreate.push({ tag_name: tag });
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

        const tag_arr = await Tag.findAll({ where: { tag_name: tags } });
        const tag_arr_id = tag_arr.map(tag => tag.tag_id);
        const communityTagsToCreate = tag_arr_id.map(tagId => ({
            community_id: newCommunity.community_id,
            tag_id: tagId
        }));

        await Community_Tag.bulkCreate(communityTagsToCreate, {
            ignoreDuplicates: true
        });
        
        res.status(201).json({
            status: 201,
            message: "Create community successfully!",
            data: {
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
            }
        });
    } catch(error) {
        res.status(500).json({
            data: {},
            status: 500,
            message: "Failed to create community!"
        });
    }
};

const getCommunityDetail = async (req, res) => {
    const community = await Community.findOne({where: {community_id: req.params.community_id}});

    if (!community)
        return res.status(404).json({
            data: {},
            status: 404,
            message: "Community not found!"
        });
    
    return res.status(200).json({
        data: community,
        status: 200,
        message: "Get detail successfully!"
    });
}

module.exports = {
    getCommunityList,
    createCommunity,
    getCommunityDetail
}
