//const Challenge = require("../models/Challenge");
const { Challenge } = require("../models/Challenge");
const TestCase = require("../models/TestCase");
const User = require("../models/User");
const Discussion = require("../models/Discussion");
const Contest = require("../models/Contest");
const Submission = require("../models/Submission");
const Signup = require("../models/Signup");
const Moderator = require("../models/Moderator");
const Bookmark = require("../models/Bookmark");
const { validationResult } = require("express-validator")
const Sequelize = require("sequelize");

const { c, cpp, java, node, python } = require("compile-run");


module.exports = {
    async challenge(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }
        try {
            const funct_node = (name, no_of_args) => {
                const func = `
        # Complete the ${name} function below.
        #You dont need to provide value in arguement it will be given by compiler
        function ${name}('use ${no_of_args} args here'){
            return
        }`
                return func
            }
            const funct_py = (name, no_of_args) => {
                const func =
                    `#!/bin/python3
import math
import os
import random
import re
import sys
#Complete the ${name} function below.
#You dont need to provide value in arguement it will be given by compiler
def ${name}('use ${no_of_args} args here'):
    return
`
                return func
            }
            const user = req.user
            const { name, description, question, output, editorial, maxScore, func_name, no_of_args } = req.body;
            const func_py = funct_py(func_name, no_of_args)
            const func_node = funct_node(func_name, no_of_args)
            const func_java = 'not defined'
            const func_c = 'not defined'
            const func_cpp = 'not defined'
            if (user === undefined) {
                const challenge = await Challenge.create({ name, description, question, output, editorial, maxScore, func_name, no_of_args, func_py, func_node, func_java, func_c, func_cpp });
                res.status(201).json({ status: 201, challenge: challenge });
            }
            else {
                const challenge = await Challenge.create({ name, description, question, output, editorial, maxScore, createdBy: user.id, func_name, no_of_args, func_py, func_node, func_java, func_c, func_cpp });
                res.status(201).json({ status: 201, challenge: challenge, createdBy: user._id });
            }


        } catch (err) {
            console.log(err.message);
            if (err.message === 'Mongo Error') {
                res.status(400).send("Problem Name Should be Different");
            } else {
                res.status(500).send("Server Error");
            }
        }
    },
    async testCase(req, res) {
        try {
            const user = req.user;
            const challengename = req.params.challenge
            if(user === undefined){
                let challenge = await Challenge.findOne({ where: { name: challengename ,createdBy: null} })
                let { result, input } = req.body
                let func = challenge.dataValues.func_name
                input = input.split(",")
                let newinput = [];
                for (i = 0; i < input.length; i++) {
                    if (isNaN(input[i]) == false) {
                        newinput.push(parseInt(input[i]))
                    }
                    else if (typeof (input[i]) == 'string') {
                        newinput.push(`"${input[i]}"`)
                    }
                    else {
                        newinput.push(input[i])
                    }
                }
                let testCase = 0
                if (typeof (input) == 'string') {
                    testCase = await TestCase.create({ result, input: `${func}(${newinput})`, challenge: challenge.dataValues.id });
                }
                else {
                    testCase = await TestCase.create({ result, input: `${func}(${newinput})`, challenge: challenge.dataValues.id });
                }
                res.status(201).json({ statuscode: 201, testCase: testCase })
            }
            else {
                let challenge = await Challenge.findOne({ where: { name: challengename ,createdBy: user.id} })
                let { result, input } = req.body
                let func = challenge.dataValues.func_name
                input = input.split(",")
                let newinput = [];
                for (i = 0; i < input.length; i++) {
                    if (isNaN(input[i]) == false) {
                        newinput.push(parseInt(input[i]))
                    }
                    else if (typeof (input[i]) == 'string') {
                        newinput.push(`"${input[i]}"`)
                    }
                    else {
                        newinput.push(input[i])
                    }
                }
                let testCase = 0
                if (typeof (input) == 'string') {
                    testCase = await TestCase.create({ result, input: `${func}(${newinput})`, challenge: challenge.dataValues.id, user: user.id  });
                }
                else {
                    testCase = await TestCase.create({ result, input: `${func}(${newinput})`, challenge: challenge.dataValues.id, user: user.id  });
                }
                res.status(201).json({ statuscode: 201, testCase: testCase })
            }

        }
        catch (err) {
            console.log(err)
            res.status(500).send("Server Error");
        }
    },
    async challengeDiscussion(req, res) {
        try {
            const challengename = req.params.challenge
            let challenge = await Challenge.findOne({
                where: {
                    name: challengename
                }
            });
            const user = req.user;
            const { reply } = req.body;
            if (!reply) return res.status(400).json({ statusCode: 400, message: 'Bad Request' });

            const createDiscussion = await Discussion.create({ reply: reply, challenge: challenge.id, user: user.id });

            res.status(201).json({ statusCode: 201, createDiscussion });
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error')
        }
    },
    async contest(req, res) {
        try {
            const details = req.body
            const user = req.user
            details.organizedBy = user.id
            const contest = await Contest.create(details)
            res.json({ contest: contest })
        }
        catch (err) {
            console.log(err.message)
            res.status(500).send('Server Error')
        }
    },

    async submission(req, res) {
        try {
            const user = req.user;
            const { language, code } = req.body
            console.log(language)
            const challengename = req.params.challenge
            let challenge = await Challenge.findOne({ where: { name: challengename } });
            let testCases = await TestCase.findAll({ where: { challenge: challenge.dataValues.id } })
            //console.log(challenge)
            //console.log(testCases[0].dataValues.input)
            // console.log( testCases[0].dataValues.result)
            const maxScore = challenge.dataValues.maxScore
            let score = 0;
            let scorepertc = maxScore / testCases.length


            if (language == 'python') {
                for (i = 0; i < testCases.length; i++) {
                    const input = '\n' + testCases[i].dataValues.input
                    const newcode = code + input
                    const result = await python.runSource(newcode);
                    if (code.includes('\n') == false) {
                        result.stdout = result.stdout.replace('\n', '')
                    }
                    else if (code.includes('\n')) {
                        result.stdout = result.stdout.slice(0, -1)
                    }
                    if (result.stderr.length != 0) console.log(result.stderr)
                    else if (result.stdout == testCases[i].dataValues.result) {
                        score = score + scorepertc
                    }
                    else {
                        score = score
                    }
                }
                const submission = await Submission.create({ code: code, score: score, challenge: challenge.dataValues.id, user: user.id, language: language });
                res.json({ score: score, submission: submission })
            }

            else if (language == 'node') {
                for (i = 0; i < testCases.length; i++) {
                    const input = '\n' + testCases[i].dataValues.input
                    const newcode = code + input

                    const result = await node.runSource(newcode);
                    if (code.includes('\n') == false) {
                        result.stdout = result.stdout.replace(/\n/g, '')
                    }
                    else if (code.includes('\n')) {
                        result.stdout = result.stdout.slice(0, -1)
                    }

                    if (result.stderr.length != 0) console.log(result.stderr)
                    else if (result.stdout == testCases[i].dataValues.result) {
                        score = score + scorepertc
                    }
                    else {
                        score = score
                    }
                }
                const submission = await Submission.create({ code: code, score: score, challenge: challenge.dataValues.id, user: user.id, language: language });
                res.json({ score: score, submission: submission })
            }
        }
        catch (err) {
            res.status(500).send(err)
        }
    },
    async getChallenge(req, res) {
        try {
            const user = req.user
            const challenges = await Challenge.findAll({
                where: Sequelize.and(
                    { contest: null },
                    Sequelize.or(
                        { createdBy: null },
                        { createdBy: user.id }
                    )
                )
            })

            res.json({ challenges: challenges })
        }
        catch (err) {
            console.log(err);
            res.send('Server Error')
        }
    },

    async contestChallenge(req, res) {
        try {
            const user = req.user;
            const contestName = req.params.contest;
            const challengeName = req.params.challenge;
            const contest = await Contest.findOne({
                where: {
                    name: contestName
                }
            });
            let challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            });
            let testcase = await TestCase.findOne({
                where: {
                    challenge: challenge.id
                }
            });
            if(testcase !== null) {
                challenge.dataValues.contest = contest.id
                challenge.dataValues.name += '-' + contest.name
                challenge.dataValues.id = null
                const challengeCreation = await Challenge.create(challenge.dataValues)
                testcase.dataValues.id = null
                testcase.dataValues.challenge = challengeCreation.id
                const testcaseCreation = await TestCase.create(testcase.dataValues)
                res.json({ challenge: challengeCreation, testcase: testcaseCreation })
            } else {
                challenge.dataValues.contest = contest.id
                challenge.dataValues.name += '-' + contest.name
                challenge.dataValues.id = null
                const challengeCreation = await Challenge.create(challenge.dataValues)
                res.json({ challenge: challengeCreation})
            }
 
        } catch (err) {
            console.log(err);
            res.send('Server Error')
        }
    },

    async contestSignup(req, res) {
        try {
            const user = req.user;
            const contestName = req.params.contest;
            const contest = await Contest.findOne({
                where: {
                    name: contestName
                }
            });
            const signup = await Signup.create({ userId: user.id, contestId: contest.id })
            res.status(201).json({ statusCode: 201, signups: signup });

        } catch (err) {
            console.log(err);
            res.send('Server Error');
        }
    },

    async contestModerator(req, res) {
        try {
            const contestName = req.params.contest;
            const username = req.params.username;
            const contest = await Contest.findOne({
                where: {
                    name: contestName
                }
            });
            const user = await User.findOne({
                where: {
                    username: username
                }
            });
            const moderator = await Moderator.create({ userId: user.id, contestId: contest.id })
            res.status(201).json({ statusCode: 201, moderator: moderator });

        } catch (err) {
            console.log(err);
            res.send('Server Error');
        }
    },

    async addBookmark(req, res) {
        try {
            const user = req.user;
            const challengeName = req.params.challenge;
            const challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            });

            const searchbookmark = await Bookmark.findOne({
                where: {
                    userId: user.id
                }
            });
            if (searchbookmark === null) {
                const addBookmark = await Bookmark.create({ userId: user.id, challengeId: challenge.dataValues.id });
                res.status(201).json({ addBookmark: addBookmark });
            }
            else {
                throw new Error('Already Bookmarked')
            }
        } catch (err) {
            console.log(err.message);
            if (err.message === 'Already Bookmarked') {
                res.send("Already Bookmarked");
            }
            res.send("Server Error");
        }
    },

    async deleteBookmark(req, res) {
        try {
            const user = req.user;
            const challengeName = req.params.challenge;
            const challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            });
            const searchbookmark = await Bookmark.destroy({
                where: {
                    userId: user.id,
                    challengeId: challenge.dataValues.id
                }
            });

            if (searchbookmark === 1) {
                res.send("Bookmard Deleted");
            }


        } catch (err) {
            console.log(err.message);
            res.send("Server Error");
        }
    },

    async updateChallenge(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }
        try {
            const funct_node = (name, no_of_args) => {
                const func = `
    # Complete the ${name} function below.
    #You dont need to provide value in arguement it will be given by compiler
    function ${name}('use ${no_of_args} args here'){
        return
    }`
                return func
            }
            const funct_py = (name, no_of_args) => {
                const func =
                    `#!/bin/python3
    import math
    import os
    import random
    import re
    import sys
    # Complete the ${name} function below.
    #You dont need to provide value in arguement it will be given by compiler
    def ${name}('use ${no_of_args} args here'):
        return
    `
                return func
            }
            const user = req.user
            const challengeName = req.params.challenge
            const details = req.body
            const challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            });
            if (details.hasOwnProperty('func_name')) {
                if (details.hasOwnProperty('no_of_args') == false) {
                    details.no_of_args = challenge.dataValues.no_of_args
                }
                const { func_name, no_of_args } = details
                details.func_py = funct_py(func_name, no_of_args)
                details.func_node = funct_node(func_name, no_of_args)
            }

            if(user === undefined) {
                const newchallenge = await Challenge.update(
                    { ...details },
                   {where: {
                        name: challengeName,
                        createdBy: null
                    }}
                )
                res.json({ updatechallenge: newchallenge })
            }
            else {
            const newchallenge = await Challenge.update(
                { ...details },
               {where: {
                    name: challengeName,
                    createdBy: user.id
                }}
            )
            res.json({ updatechallenge: newchallenge })
            }
        }
        catch (err) {
            console.log(err.message)
            res.send(err)
        }
    },

    async deleteContestModerator(req, res) {
        try {
            const contestName = req.params.contest;
            const username = req.params.username;
            const contest = await Contest.findOne({
                where: {
                    name: contestName
                }
            });
            const user = await User.findOne({
                where: {
                    username: username
                }
            });
            const moderator = await Moderator.destroy( { where: { userId: user.id, contestId: contest.id }})
            if (moderator === 1) {
                res.send(`${username} is Removed as Moderator`);
            }
        } catch (err) {
            console.log(err);
            res.send('Server Error');
        }
    },

    async deleteChallenge(req,res){
        try {
            const user = req.user
            const challengeName = req.params.challenge

            if(user === undefined) {
                const challenge = await Challenge.findOne({
                    where: {
                        name: challengeName
                    }
                })
                const testCase = await TestCase.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const discussion = await Discussion.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const submission = await Submission.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const bookmarks = await Bookmark.destroy({
                    where: {
                        challengeId: challenge.dataValues.id
                    }
                })

                const deletechallenge = await Challenge.destroy({
                    where: {
                        name: challengeName,
                        createdBy: null
                    }
                })
                if (deletechallenge === 1 || testCase === 1 || discussion === 1 || submission === 1 || bookmarks === 1) {
                    res.send("Chalenge Deleted");
                }
            }
            else {
                const challenge = await Challenge.findOne({
                    where: {
                        name: challengeName
                    }
                })
                const testCase = await TestCase.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const discussion = await Discussion.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const submission = await Submission.destroy({
                    where: {
                        challenge: challenge.dataValues.id
                    }
                })

                const bookmarks = await Bookmark.destroy({
                    where: {
                        challengeId: challenge.dataValues.id
                    }
                })
                const deletechallenge = await Challenge.destroy({
                    where: {
                        name: challengeName,
                        createdBy: user.id
                    }
                })
                if (deletechallenge === 1 || testCase === 1 || discussion === 1 || submission === 1 || bookmarks === 1) {
                    res.send("Chalenge Deleted");
                }
                
            }
            
        } catch (err) {
            console.log(err.message)
            res.send("Server Error")
        }
    },

    async contestUpdate(req, res) {
        try {
            const contestName = req.params.contest;
            const user = req.user;
            const details = req.body;

            const updateContest = await Contest.update(
                { ...details },
                {where: {
                    name: contestName,
                    organizedBy: user.id
                }}
            )
            res.json({statusCode: 201, updatedContest: updateContest});

        } catch (err) {
            console.log(err.message)
            res.send("Server Error");
        }
    },

    async deleteContest(req, res) {
        try {
            const contestName = req.params.contest;
            const user = req.user;

            const contest = await Contest.findOne({
                where: {
                    name: contestName
                }
            })

            const challenge = await Challenge.findOne({
                where: {
                    contest: contest.dataValues.id
                }
            })
            console.log(challenge)

            if(challenge === null) {
                const deleteSignup = await Signup.destroy({
                    where: {
                        contestId: contest.dataValues.id
                    }
                })
    
                const deleteModerator = await Moderator.destroy({
                    where: {
                        contestId: contest.dataValues.id
                    }
                })
    
                const deleteContest = await Contest.destroy({
                    where: {
                        name: contestName,
                        organizedBy: user.id
                    }
                })

            if (deleteContest === 1  || deleteSignup === 1 || deleteModerator === 1) {
                res.send("Contest Deleted");
            }

            } else {

            const testCase = await TestCase.destroy({
                where: {
                    challenge: challenge.dataValues.id
                }
            })

            const discussion = await Discussion.destroy({
                where: {
                    challenge: challenge.dataValues.id
                }
            })

            const submission = await Submission.destroy({
                where: {
                    challenge: challenge.dataValues.id
                }
            })

            const bookmarks = await Bookmark.destroy({
                where: {
                    challengeId: challenge.dataValues.id
                }
            })

            const deleteSignup = await Signup.destroy({
                where: {
                    contestId: contest.dataValues.id
                }
            })

            const deleteModerator = await Moderator.destroy({
                where: {
                    contestId: contest.dataValues.id
                }
            })

            const deletechallenge = await Challenge.destroy({
                where: {
                    contest: contest.dataValues.id
                }
            })

            const deleteContest = await Contest.destroy({
                where: {
                    name: contestName
                }
            })

            if (deleteContest === 1 || deletechallenge === 1 || testCase === 1 || discussion === 1 || submission === 1 || bookmarks === 1 || deleteSignup === 1 || deleteModerator === 1) {
                res.send("Contest Deleted");
            }
        }
        } catch (err) {
            console.log(err.message);
            res.send("Server Error");
        }
    },

    async testCaseUpdate(req, res){
        try {
            const user = req.user;
            const challengeName = req.params.challenge;
            const testCaseId = req.params.testCaseId;
            const details = req.body;

            const challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            })

            if(user === undefined) {
                const updatetestCase = await TestCase.update(
                    { ...details },
                    {where: {
                        challenge: challenge.dataValues.id,
                        id: testCaseId,
                        user: null
                    }}
                )
                res.json({statusCode: 201, updatedtestCase: updatetestCase});
            } else {
                const updatetestCase = await TestCase.update(
                    { ...details },
                    {where: {
                        challenge: challenge.dataValues.id,
                        id: testCaseId,
                        user: user.id
                    }}
                )
                res.json({statusCode: 201, updatedtestCase: updatetestCase});
            }

        } catch (err) {
            console.log(err.message);
            res.send("Server Error");
        }
    },

    async testCaseDelete(req, res) {
        try {
            const user = req.user;
            const challengeName = req.params.challenge;
            const testCaseId = req.params.testCaseId;

            const challenge = await Challenge.findOne({
                where: {
                    name: challengeName
                }
            })

            if(user === undefined) {
                const deletetestCase = await TestCase.destroy(
                    {where: {
                        challenge: challenge.dataValues.id,
                        id: testCaseId,
                        user: null
                    }}
                )
                res.json({statusCode: 201, deletetestCase: deletetestCase});
            } else {
                const deletetestCase = await TestCase.destroy(
                    {where: {
                        challenge: challenge.dataValues.id,
                        id: testCaseId,
                        user: user.id
                    }}
                )
                res.json({statusCode: 201, deletetestCase: deletetestCase});
            }
            
        } catch (err) {
            console.log(err.message);
            res.send("Server Error");
        }
    }

}