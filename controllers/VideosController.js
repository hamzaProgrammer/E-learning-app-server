const Videos = require('../models/VideosSchema')
const PlayLists = require('../models/PlayListSchema')
const {
    getVideoDurationInSeconds
} = require('get-video-duration')
const fs = require('fs');

// add New Vidoe
const addNewVideo = async (req, res) => {
    const {
        title,
        desc,
        playListId
    } = req.body;

    if ((req.file.mimetype !== "video/mp4")) {
        return res.json({
            success: false,
            message: "No Video File Found"
        });
    }

    if (!title || !desc || !playListId || !req.file.filename) {
        return res.json({
            success: false,
            message: "Please fill All required credentials"
        });
    } else {
        const check = await Videos.find({
            title: title,
            playListId: playListId
        })
        if (check.length > 0) {
            return res.json({
                success: false,
                message: 'Video Title Already Exists'
            })
        } else {
            // pushing play list slider images
            let length;
            if (req.file) {
                req.body.videoUrl = req.file.filename

                // checking file size
                const filePath = `./videos/${req.file.filename}`;
                var fileInfo = fs.statSync(filePath);
                var fileSizeMB = fileInfo.size / (1024 * 1024);
                if (fileSizeMB > 100) { // if filw size is graeter tha 70MB , file will not be uploaded
                    return res.status(201).json({
                        succes: false,
                        message: `Sorry! But, You can not upload video of more than 100MB and your file size is ${fileSizeMB}`
                    })
                }

                // calculation duration of video
                await getVideoDurationInSeconds(`./videos/${req.file.filename}`).then((duration) => {
                    length = secondsToMinutesSec(duration)
                })
            }

            const newPlayList = new Videos({
                length: length,
                ...req.body
            })
            try {
                let addedVideo = await newPlayList.save();

                // putting video into playlist array
                await PlayLists.findByIdAndUpdate(playListId, {
                    $push: {
                        videos: addedVideo._id
                    }
                }, {
                    new: true
                })

                res.status(201).json({
                    success: true,
                })
            } catch (error) {
                console.log("Error in addNewVideo and error is : ", error)
                res.status(201).json({
                    succes: false,
                    error
                })
            }
        }
    }
}

// uodate Video
const updateVideo = async (req, res) => {
    const {
        id
    } = req.params
    if (!id) {
        return res.status(504).json({
            success: false,
            message: 'Id is Required for Updation '
        })
    } else {
        const isExist = await Videos.findById(id)
        if (!isExist) {
            return res.status(201).json({
                success: false,
                message: 'Video Id is Incorrect or Video Does Not Exists '
            })
        } else {
            try {
                // pushing play list slider images
                if (req.file) {
                    if ((req.file.mimetype !== "video/mp4")) {
                        return res.json({
                            success: false,
                            message: "No Video File Found"
                        });
                    }

                    // checking file size
                    const filePath = `./videos/${req.file.filename}`;
                    var fileInfo = fs.statSync(filePath);
                    var fileSizeMB = fileInfo.size / (1024 * 1024);
                    if (fileSizeMB > 100) { // if filw size is graeter tha 70MB , file will not be uploaded
                        return res.status(404).json({
                            succes: false,
                            message: `Sorry! But, You can not upload video of more than 100MB and your file size is ${fileSizeMB}`
                        })
                    }

                    // calculation duration of video
                    await getVideoDurationInSeconds(`./videos/${req.file.filename}`).then((duration) => {
                        length = secondsToMinutesSec(duration)
                    })
                    req.body.videoUrl = "";
                    req.body.videoUrl = req.file.filename
                }
                const updatedUser = await Videos.findByIdAndUpdate(id, {
                    $set: req.body
                }, {
                    new: true
                })
                res.status(201).json({
                    success: true,
                })

            } catch (error) {
                console.log("Error in updateVideo and error is : ", error)
                return res.status(504).json({
                    success: false,
                    error
                })
            }
        }
    }
}

// delete Video
const deleteVideo = async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const gotVideo = await Videos.findById(id);
        if (!gotVideo) {
            return res.status(201).json({
                success: false,
                message: "No Video Found "
            })
        } else {
            const deletedVideo = await Videos.findByIdAndDelete(id);

            if (!deletedVideo) {
                return res.json({
                    success: false,
                    message: 'Video Not Found ',
                });
            } else {
                const isExistPlayList = await PlayLists.findById(gotVideo.playListId)
                // removing from playlist videos array
                if (isExistPlayList) {
                    await PlayLists.findByIdAndUpdate(gotVideo.playListId, {
                        $pull: {
                            videos: id
                        }
                    }, {
                        new: true
                    })
                }
                return res.json({
                    success: true,
                });
            }
        }
    } catch (error) {
        console.log("Error in deleteVideo and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}

// get all Videos of a Playlist
const getAllVideosOfPlayList = async (req, res) => {
    const {
        playListId
    } = req.params;
    try {
        const allVideos = await Videos.find({
            playListId: playListId
        }, {
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            playListId: 0
        })
        if (allVideos === null) {
            return res.json({
                success: false,
                message: 'No Videos Found ',
            });
        } else {
            return res.json({
                allVideos,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getAllVideosOfPlayList and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}

// get Single Video
const getSingleVideo = async (req, res) => {
    const {
        id
    } = req.params;
    try {
        const singleVideo = await Videos.findById(id, {
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            playListId: 0
        })

        if (singleVideo === null) {
            return res.json({
                success: false,
                message: 'No Video Found ',
            });
        } else {
            return res.json({
                singleVideo,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getSingleVideo and error is : ", error)
        return res.json({
            success: false,
            error
        });
    }
}

// get all Videos Count
const getAllVideosCount = async (req, res) => {
    try {
        const count = await Videos.find({}).count();
        if (!count) {
            return res.json({
                success: false,
                message: 'No Vidoeos Found ',
            });
        } else {
            return res.json({
                count,
                success: true,
            });
        }
    } catch (error) {
        console.log("Error in getAllVideosCount and error is : ", error)
        return res.json({
            error,
            success: false,
        });
    }
}


// converting sec to minutes
function secondsToMinutesSec(value) {
    const sec = parseInt(value, 10); // convert value to number if it's string
    let hours = Math.floor(sec / 3600); // get hours
    let minutes = Math.floor((sec - (hours * 3600)) / 60); // get minutes
    let seconds = sec - (hours * 3600) - (minutes * 60); //  get seconds
    // add 0 if value < 10; Example: 2 => 02
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return minutes + ':' + seconds; // Return is HH : MM : SS
}

module.exports = {
    addNewVideo,
    updateVideo,
    getAllVideosOfPlayList,
    getSingleVideo,
    deleteVideo,
    getAllVideosCount
}