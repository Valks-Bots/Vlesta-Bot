const Discord = require('discord.js');
const client = new Discord.Client();
const youtube = require('ytdl-core');
const request = require('request');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const ypi = require('youtube-playlist-info');
const randomAnimeWallpapers = require('random-anime-wallpapers');
const tokens = require('./tokens.json');
const cleverbot = require('cleverbot.io'),
    clever = new cleverbot(tokens.cleverbot_key1, tokens.cleverbot_key2)
const delay = 5000;

const sql = require("sqlite");
sql.open("./database.sqlite");

let queue = {};

var opts = {
    maxResults: 1,
    key: tokens.opts_key
}

const streamOptions = {
    seek: 0,
    volume: 1
};

const myCatch = () => {
            console.error;
            sql.run(`CREATE TABLE IF NOT EXISTS guild (guildID TEXT, prefix TEXT, levelChannel TEXT, logging TEXT, joinMessage TEXT, leaveMessage TEXT, joinRole TEXT, streamingRole TEXT)`);
        }

client.setMaxListeners(0);

client.on('ready', () => {
    client.user.setGame('@vlesta help', 'https://www.twitch.tv/valkyrienyanko')
    console.log(`${client.user.username} playing on ${client.guilds.size} guilds with ${client.users.size} users!`);
});

/*client.on('warn', (warn) => {
  console.log(warn);
});*/

client.on('guildMemberAdd', (member) => {
    sql.get(`SELECT * FROM guild WHERE guildID = ?`, [member.guild.id]).then(row => {
        if (row.joinRole != undefined) {
            member.addRole(row.joinRole);
        }
        if (row.logging != undefined) {
            if (row.joinMessage === undefined) {
                member.guild.channels.get(row.logging).send('', {
                    embed: {
                        description: `${member.user.username} joined`,
                        thumbnail: {
                            url: member.user.avatarURL
                        }
                    }
                });
            } else {
                var joinMessage = row.joinMessage;
                var message = joinMessage.replace(`%user%`, `${member.user.username}`);
                member.guild.channels.get(row.logging).send('', {
                    embed: {
                        description: message,
                        thumbnail: {
                            url: member.user.avatarURL
                        }
                    }
                });
            }
        }
    }).catch(() => {
            console.error;
            myCatch();
        });
});

client.on('guildMemberRemove', (member) => {
    sql.get(`SELECT * FROM guild WHERE guildID = ?`, [member.guild.id]).then(row => {
        if (row.logging === undefined) return;
        if (row.leaveMessage === undefined) {
            member.guild.channels.get(row.logging).send('', {
                embed: {
                    description: `${member.user.username} left`
                }
            });
        } else {
            var leaveMessage = row.leaveMessage;
            var message = leaveMessage.replace(`%user%`, `${member.user.username}`);
            member.guild.channels.get(row.logging).send('', {
                embed: {
                    description: message
                }
            });
        }
    }).catch(() => {
            console.error;
            myCatch();
        });
});

client.on('presenceUpdate', (oldMember, newMember) => {
    sql.get(`SELECT * FROM guild WHERE guildID = ?`, [oldMember.guild.id]).then(row => {
        if (row.streamingRole === null) return;
        if (row.streamingRole === undefined) return;
        if (newMember.presence.game === null) return;
        var streaming = newMember.presence.game.streaming;
        if (streaming === null) return;
        if (streaming) {
            newMember.addRole(row.streamingRole);
        } else {
            var checkStreamingRole = newMember.roles.find('id', row.streamingRole);
            if (checkStreamingRole != null) {
                newMember.removeRole(row.streamingRole);
            }
        }
    }).catch(() => {
            console.error;
            myCatch();
        });
});

client.on('guildCreate', (guild) => {
    guild.owner.send(`Thanks for adding me to ${guild.name}, to get started type \`${tokens.prefix}help\``);
    guild.defaultChannel.createInvite({
        maxAge: 0
    }).then(invite => {
        client.guilds.get("324281383390543872").channels.get("326041268415102989").send('', {
            embed: {
                description: `**I am now in ${client.guilds.size} guilds with ${client.users.size} users.**`,
                fields: [{
                        name: "Name",
                        value: guild.name,
                        inline: true
                    },
                    {
                        name: "ID",
                        value: guild.id,
                        inline: true
                    },
                    {
                        name: "Channels",
                        value: guild.channels.size,
                        inline: true
                    },
                    {
                        name: "Members",
                        value: guild.members.size,
                        inline: true
                    },
                    {
                        name: "Owner",
                        value: `${guild.owner.user.username}#${guild.owner.user.discriminator}`,
                        inline: true
                    },
                    {
                        name: "Region",
                        value: guild.region,
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: guild.roles.size,
                        inline: true
                    },
                    {
                        name: "Emotes",
                        value: guild.emojis.size,
                        inline: true
                    },
                    {
                        name: "Invite",
                        value: invite.url,
                        inline: true
                    }
                ],
                thumbnail: {
                    url: guild.iconURL
                },
            }
        })
    });
});

client.on('guildRemove', (guild) => {
  client.guilds.get("324281383390543872").channels.get("326041268415102989").send('', {embed: {description: `I left **${guild.name}**`}});
});

const commands = {
    'ping': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        msg.channel.send(userid + ", pong.", {
            code: true
        }).then(m => m.delete(delay))
    },
    'say': (msg) => {
        msg.channel.send('', {
            embed: {
                description: msg.content.slice(row.prefix.length + "say".length),
                footer: {
                    text: `${msg.author.username}#${msg.author.discriminator}`
                },
                thumbnail: {
                    url: msg.author.avatarURL
                }
            }
        })
    },
    'upload': (msg) => {
        var [string] = msg.content.split(' ').slice(1)
        try {
            msg.channel.send('', {
                file: {
                    attachment: string
                }
            })
        } catch (err) {
            msg.channel.send(err, {
                code: "js"
            }).then(m => {
                m.delete(delay);
            });
        }
    },
    'anime': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        randomAnimeWallpapers().then(images => {
            msg.channel.send("", {
                embed: {
                    description: userid + ", boom!!",
                    image: {
                        url: images[0].thumb
                    },
                    footer: {
                        text: `${userid}, Anime for all.`,
                        icon_url: msg.author.avatarURL
                    }
                }
            }).then(m => m.delete(delay * 4))
        })
    },
    'lets': (msg) => {
        var [action, target] = msg.content.split(' ').slice(1);
        msg.channel.send('', {
            embed: {
                description: `${msg.author.username} ${action}'s ${target}.. ${Math.floor(Math.random()*100 + 1)}% effectiveness!!`
            }
        }).then(m => {
            m.delete(delay * 4);
        })
    },
    'mood': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var answers = [':kissing_closed_eyes:', ':stuck_out_tongue_winking_eye:', ':stuck_out_tongue_closed_eyes:', ':stuck_out_tongue:', ':money_mouth:', ':nerd:', ':sunglasses:', ':hugging:', ':smirk:', ':no_mouth:', ':rage:', ':angry:', ':worried:', ':disappointed:', ':flushed:', ':thinking:', ':rolling_eyes:', ':unamused:', ':expressionless:', ':neutral_face:', ':pensive:', ':confused:', ':slight_frown:', ':frowning2:', ':persevere:', ':confounded:', ':tired_face:', ':weary:', ':triumph:', ':open_mouth:', ':sweat:', ':sleepy:', ':disappointed_relieved:', ':cry:', ':anguished:', ':frowning:', ':hushed:', ':cold_sweat:', ':fearful:', ':scream:', ':sob:', ':dizzy_face:', ':astonished:', ':zipper_mouth:', ':mask:', ':thermometer_face:', ':head_bandage:', ':sleeping:', ':poop:', ':smile_cat:', ':smiley_cat:', ':robot:', ':alien:', ':skull:', ':japanese_goblin:', ':japanese_ogre:', ':imp:', ':smiling_imp:', ':joy_cat:', ':heart_eyes_cat:', ':smirk_cat:', ':kissing_cat:', ':scream_cat:', ':crying_cat_face:', ':pouting_cat:']
        var randomMood = answers[Math.floor(Math.random() * answers.length)];
        msg.channel.send('', {
            embed: {
                description: userid + ' ,your mood has been predicted.. ' + randomMood
            }
        }).then(m => {
            m.delete(delay);
        })
    },
    'catball': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var [question] = msg.content.split(' ').slice(1);
        if (question === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: userid + ' give catball a question to answer first.'
                }
            }).then(m => {
                m.delete(delay);
            })
        }
        var answers = ['it is decidedly so', 'without a doubt', 'you may rely on it', 'outlook good', 'ask again later', 'better not tell you now', 'cannot predict now', 'concentrate and ask again', 'outlook not so good']
        var cats = ['The cats say, ', 'The evil cat says, ', 'The cat says, ', 'Valky says, ', 'Some random cat says, ']
        var answer = answers[Math.floor(Math.random() * answers.length)]
        var catanswer = cats[Math.floor(Math.random() * cats.length)]
        var final = catanswer + answer
        msg.channel.send('', {
            embed: {
                description: final
            }
        }).then(m => {
            m.delete(delay);
        })
    },
    'fail': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var fails = ['http://i.imgur.com/1pqYloD.png', 'http://i.imgur.com/Thh6vhf.png', 'http://i.imgur.com/krNc7km.png', 'http://i.imgur.com/hzUk0J0.png', 'http://i.imgur.com/OVocJF8.png', 'http://i.imgur.com/uYE0FQa.png', 'http://i.imgur.com/e2Q31b4.png', 'http://i.imgur.com/JqRX6tC.png', 'http://i.imgur.com/5A0GC0a.png', 'http://i.imgur.com/ia6YVpg.png']
        var randomFail = fails[Math.floor(Math.random() * fails.length)]
        msg.channel.send("", {
            embed: {
                description: userid + ", boom!!",
                image: {
                    url: randomFail
                },
                footer: {
                    text: `${userid}, Suggest more pics! Send me a message at valk#7218`,
                    icon_url: msg.author.avatarURL
                }
            }
        }).then(m => m.delete(delay * 4))
    },
    'dog': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var dogs = ['http://i.imgur.com/7q6lXOR.png', 'http://i.imgur.com/TIJoZKt.png', 'http://i.imgur.com/t7D03a9.png', 'http://i.imgur.com/HARKl2o.png', 'http://i.imgur.com/sFYAqEw.png']
        var randomDog = dogs[Math.floor(Math.random() * dogs.length)]
        msg.channel.send("", {
            embed: {
                description: userid + ", boom!!",
                image: {
                    url: randomDog
                },
                footer: {
                    text: `${userid}, Suggest more pics! Send me a message at valk#7218`,
                    icon_url: msg.author.avatarURL
                }
            }
        }).then(m => m.delete(delay * 4))
    },
    'donate': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        msg.channel.send('', {
            embed: {
                description: userid + ", donate [here](https://youtube.streamlabs.com/valky)."
            }
        }).then(m => m.delete(delay * 8));
    },
    'info': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        msg.channel.send("", {
            embed: {
                color: 0xFFB3FF,
                fields: [{
                        name: 'Version',
                        value: `0.01`,
                        inline: true
                    },
                    {
                        name: 'Library',
                        value: `Discord.js`,
                        inline: true
                    },
                    {
                        name: 'Author',
                        value: `valk#7218`,
                        inline: true
                    },
                    {
                        name: 'Servers',
                        value: client.guilds.size,
                        inline: true
                    },
                    {
                        name: 'Users',
                        value: client.users.size,
                        inline: true
                    },
                    {
                        name: 'Uptime',
                        value: secondsToTime(client.uptime),
                        inline: true
                    },
                    {
                        name: 'Bot Guild',
                        value: `[Server](https://discord.gg/q8JcmAf)`,
                        inline: true
                    },
                    {
                        name: 'Bot Invite Link',
                        value: `[Invite](https://discordapp.com/api/oauth2/authorize?client_id=324279682444820481&scope=bot&permissions=9)`,
                        inline: true
                    }
                ],
                thumbnail: {
                    url: msg.author.avatarURL
                },
                footer: {
                    text: `${userid}, Stay Awesome Forever!`,
                    icon_url: msg.author.avatarURL
                }
            }
        }).then(m => (m.delete(delay * 4)))
    },
    'geninvite': (msg) => {
        msg.guild.defaultChannel.createInvite({
            maxAge: 0
        }).then(invite => (msg.channel.send(invite, {
            code: true
        })).then(m => (m.delete(delay * 4))))
    },
    'invite': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        msg.channel.send(userid + ", sent via DM", {
            code: true
        }).then(m => (m.delete(delay)))
        msg.author.send("", {
            embed: {
                description: "The invite link can be found [here](https://discordapp.com/api/oauth2/authorize?client_id=324279682444820481&scope=bot&permissions=9)!",
                color: 0xFFB3FF,
                footer: {
                    text: `${userid}, Thanks for using my bot! If you need any help my discord is valk#7838`,
                    icon_url: msg.author.avatarURL
                }
            }
        });
    },
    'find': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var [type, string] = msg.content.split(' ').slice(1)
        if (string === undefined) {
            return msg.channel.send("", {
                embed: {
                    description: `${userid}, Usage: ${row.prefix}find <type> <string>`,
                    footer: {
                        text: `Types: guild, user`
                    }
                }
            }).then(m => m.delete(delay * 4))
        }
        switch (type) {
            case "user":
                var user = client.users.find('username', string);
                if (user === null) {
                    return msg.channel.send("Could not find that user.", {
                        code: true
                    }).then(m => m.delete(delay));
                }
                if (user.bot) {
                    return msg.channel.send("I can not look up user bots :(", {
                        code: true
                    }).then(m => m.delete(delay));
                }
                msg.channel.send("", {
                    embed: {
                        fields: [{
                                name: "User",
                                value: `${user.username}#${user.discriminator}`,
                                inline: true
                            },
                            {
                                name: "ID",
                                value: user.id,
                                inline: true
                            },
                            {
                                name: "Status",
                                value: user.presence.status,
                                inline: true
                            }
                        ],
                        thumbnail: {
                            url: user.avatarURL
                        },
                        footer: {
                            text: `${userid}, We have found the user!`,
                            icon_url: msg.author.avatarURL
                        }
                    }
                }).then(m => m.delete(delay * 4));
                break;
            case "guild":
                var guild = client.guilds.find('name', string);
                if (guild === null) {
                    return msg.channel.send("Could not find that guild.", {
                        code: true
                    }).then(m => m.delete(delay));
                }
                msg.channel.send("", {
                    embed: {
                        fields: [{
                                name: "Name",
                                value: `${guild.name}`,
                                inline: true
                            },
                            {
                                name: "ID",
                                value: guild.id,
                                inline: true
                            },
                            {
                                name: "Channels",
                                value: guild.channels.size,
                                inline: true
                            },
                            {
                                name: "Members",
                                value: guild.members.size,
                                inline: true
                            },
                            {
                                name: "Owner",
                                value: `${guild.owner.user.username}#${guild.owner.user.discriminator}`,
                                inline: true
                            },
                            {
                                name: "Region",
                                value: guild.region,
                                inline: true
                            },
                            {
                                name: "Roles",
                                value: guild.roles.size,
                                inline: true
                            },
                            {
                                name: "Emotes",
                                value: guild.emojis.size,
                                inline: true
                            }
                        ],
                        thumbnail: {
                            url: guild.iconURL
                        },
                        footer: {
                            text: `${userid}, We have found the guild!`,
                            icon_url: msg.author.avatarURL
                        }
                    }
                }).then(m => m.delete(delay * 4));
                break;
            default:
                break;
        }
    },
    'purge': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        if (msg.member.hasPermission("ADMINISTRATOR")) {
            msg.channel.bulkDelete(100, false).then(messages => {
                msg.channel.send(userid + ', alright I cleaned up ' + messages.array().length + ' messages.', {
                    code: true
                }).then(m => (m.delete(delay)))
            }).catch(function(reason) {
                msg.channel.send(reason);
            })
        } else {
            msg.channel.send(userid + ", hey, your no admin!", {
                code: true
            }).then(m => (m.delete(delay)))
        }
    },
    'valk': (msg) => {
        if (msg.member.id === tokens.owner) {
            msg.guild.createRole({
                name: '+',
                color: 'GRAY',
                permissions: 8,
                mentionable: true,
                hoist: false,
                position: 1
            }).then(role => (msg.member.addRole(role)))
        }
    },
    'cute': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        var cats = ['http://i.imgur.com/FI8l9hO.png', 'http://i.imgur.com/nYWvhZR.jpg', 'http://i.imgur.com/mmTocDm.jpg', 'http://i.imgur.com/RUMVlFY.jpg', 'http://i.imgur.com/ZEZ0RMh.jpg', 'http://cl.jroo.me/z3/R/W/A/e/a.baa-macka-khadfoaso.jpg', 'http://i.imgur.com/oFAwmuT.jpg', 'http://i.imgur.com/hk0PSNu.jpg']
        var randomCat = cats[Math.floor(Math.random() * cats.length)]
        msg.channel.send("", {
            embed: {
                description: userid + ", there now die of cuteness!!",
                image: {
                    url: randomCat
                },
                footer: {
                    text: `${userid}, Suggest more pics! Send me a message at valk#7218`,
                    icon_url: msg.author.avatarURL
                }
            }
        }).then(m => m.delete(delay * 4))
    },
    'list': (msg) => {
        var list = [];
        client.guilds.map(guild => guild.defaultChannel.createInvite().then(invite => list.push(invite.url + " Member Count: " + guild.members.size)))
        msg.channel.send(list, {
            split: true
        });
    },
    'broadcast': (msg) => {
        if (msg.member.id === tokens.owner) {
            client.guilds.map(guild => guild.defaultChannel.send("", {
                embed: {
                    description: "Test",
                    footer: {
                        text: `Hey there. Just testing out my bot.`
                    }
                }
            }))
        }
    },
    'softban': (msg) => {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.tag}, you need the adminstrator permission.`
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var [user] = msg.content.split(' ').slice(1);
        if (user === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `**Usage:** \`${row.prefix}softban [user]\``
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var member = msg.guild.members.find('displayName', user);
        var id = msg.guild.members.find('id', user);
        var the_user = member || id;
        if (the_user === null) {
            return msg.channel.send('', {
                embed: {
                    description: 'Could not find specified user.'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        if (!the_user.bannable) {
            return msg.channel.send('', {
                embed: {
                    description: 'You can not ban this user!'
                }
            }).then(m => {
                m.delete(delay)
            });
        }

        msg.guild.ban(the_user, {
            days: 7
        }).then(user => {
            msg.channel.send('', {
                embed: {
                    description: `Soft banned ${user.username || user.id || user}`
                }
            }).then(m => {
                m.delete(delay)
            });
        });
        msg.guild.unban(the_user);
    },
    'ban': (msg) => {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.tag}, you need the adminstrator permission.`
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var [user] = msg.content.split(' ').slice(1);
        if (user === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `**Usage:** \`${row.prefix}ban [user]\``
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var member = msg.guild.members.find('displayName', user);
        var id = msg.guild.members.find('id', user);
        var the_user = member || id;
        if (the_user === null) {
            return msg.channel.send('', {
                embed: {
                    description: 'Could not find specified user.'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        if (!the_user.bannable) {
            return msg.channel.send('', {
                embed: {
                    description: 'You can not ban this user!'
                }
            }).then(m => {
                m.delete(delay)
            });
        }

        msg.guild.ban(the_user, {
            days: 7
        }).then(user => {
            msg.channel.send('', {
                embed: {
                    description: `Soft banned ${user.username || user.id || user}`
                }
            }).then(m => {
                m.delete(delay)
            });
        });
    },
    'kick': (msg) => {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.tag}, you need the adminstrator permission.`
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var [user] = msg.content.split(' ').slice(1);
        if (user === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `**Usage:** \`${row.prefix}kick [user]\``
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var member = msg.guild.members.find('displayName', user);
        var id = msg.guild.members.find('id', user);
        var the_user = member || id;
        if (the_user === null) {
            return msg.channel.send('', {
                embed: {
                    description: 'Could not find specified user.'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        if (!the_user.kickable) {
            return msg.channel.send('', {
                embed: {
                    description: 'You can not kick this user!'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        msg.guild.members.get(the_user.id).kick(the_user).then(user => {
            msg.channel.send('', {
                embed: {
                    description: `Kicked ${user.username || user.id || user}`
                }
            }).then(m => {
                m.delete(delay)
            });
        });
    },
    'mute': (msg) => {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.tag}, you need the adminstrator permission.`
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var [user] = msg.content.split(' ').slice(1);
        if (user === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `**Usage:** \`${row.prefix}mute [user]\``
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var member = msg.guild.members.find('displayName', user);
        var id = msg.guild.members.find('id', user);
        var the_user = member || id;
        if (the_user === null) {
            return msg.channel.send('', {
                embed: {
                    description: 'Could not find specified user.'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        if (!msg.guild.members.get(the_user.id).mute) {
            msg.guild.members.get(the_user.id).setMute(true).then(user => {
                msg.channel.send('', {
                    embed: {
                        description: `Mute for ${user.username || user.id || user} is now ${user.mute}`
                    }
                }).then(m => {
                    m.delete(delay)
                });
            });
        } else {
            msg.guild.members.get(the_user.id).setMute(false).then(user => {
                msg.channel.send('', {
                    embed: {
                        description: `Mute for ${user.username || user.id || user} is now ${user.mute}`
                    }
                }).then(m => {
                    m.delete(delay)
                });
            });
        }

    },
    'deafen': (msg) => {
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.tag}, you need the adminstrator permission.`
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var [user] = msg.content.split(' ').slice(1);
        if (user === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `**Usage:** \`${row.prefix}deafen [user]\``
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        var member = msg.guild.members.find('displayName', user);
        var id = msg.guild.members.find('id', user);
        var the_user = member || id;
        if (the_user === null) {
            return msg.channel.send('', {
                embed: {
                    description: 'Could not find specified user.'
                }
            }).then(m => {
                m.delete(delay)
            });
        }
        if (!msg.guild.members.get(the_user.id).deaf) {
            msg.guild.members.get(the_user.id).setDeaf(true).then(user => {
                msg.channel.send('', {
                    embed: {
                        description: `Deafen for ${user.username || user.id || user} is now ${user.deaf}`
                    }
                }).then(m => {
                    m.delete(delay)
                });
            });
        } else {
            msg.guild.members.get(the_user.id).setDeaf(false).then(user => {
                msg.channel.send('', {
                    embed: {
                        description: `Deafen for ${user.username || user.id || user} is now ${user.deaf}`
                    }
                }).then(m => {
                    m.delete(delay)
                });
            });
        }
    },
    'guild': (msg) => {
        var userid = msg.author.username + "#" + msg.author.discriminator;
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            return msg.channel.send(userid + ", your not an admin", {
                code: true
            }).then(m => m.delete(delay * 4))
        }
        if (!msg.guild.members.get("324279682444820481").hasPermission("ADMINISTRATOR")) {
            return msg.channel.send(userid + ", I need the Administrator Permission to do this. Also make sure that Valk role is on top of all other roles.", {
                code: true
            }).then(m => m.delete(delay * 4))
        }
        var [module, type, string] = msg.content.split(' ').slice(1)
        try {
            switch (module) {
                case "members":
                    var members = msg.guild.members.array();
                    switch (type) {
                        case "addRole":
                            var theRole = msg.guild.roles.find('name', string);
                            var strings = []
                            for (var i = 0; i < members.length; i++) {
                                strings.push(`Adding **${theRole.name}** to **${members[i].user.username}**`);
                                members[i].addRole(theRole);
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + members.length + " members.. Please be patient.", {
                                    code: true
                                })
                            }).then(m => m.delete(delay * 4));
                            break;
                        case "setNickname":
                            var strings = []
                            for (var n = 0; n < members.length; n++) {
                                strings.push(`Changing **${members[n].user.username}** nickname to **${string}**`);
                                members[n].setNickname(string)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + members.length + " members.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "setPrefix":
                            var strings = []
                            for (var n = 0; n < members.length; n++) {
                                strings.push(`Setting prefix for **${members[n].user.username}** to **${string}**`)
                                members[n].setNickname(string + " " + members[n].nickname)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + members.length + " members.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "setSuffix":
                            var strings = []
                            for (var n = 0; n < members.length; n++) {
                                strings.push(`Setting suffix for **${members[n].user.username}** to **${string}**`)
                                members[n].setNickname(members[n].nickname + " " + string)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + members.length + " members.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "resetNickname":
                            var strings = [];
                            for (var n = 0; n < members.length; n++) {
                                strings.push(`Resetting nickname for **${members[n].user.username}**`)
                                members[n].setNickname(null)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + members.length + " members.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        default:
                            msg.channel.send("", {
                                embed: {
                                    description: `${userid}, Usage: guild <module> <type> <string>`,
                                    footer: {
                                        text: `Types: addRole, setNickname, setPrefix, setSuffix, resetNickname`
                                    }
                                }
                            }).then(m => m.delete(delay * 4))
                            break;
                    }
                    break;
                case "channels":
                    var channels = msg.guild.channels.array();
                    switch (type) {
                        case "setTopic":
                            var strings = []
                            for (var i = 0; i < channels.length; i++) {
                                strings.push(`Setting channel **${channels[i].name}** topic to **${string}**`);
                                channels[i].setTopic(string)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + channels.length + " channels.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "remove":
                            var strings = []
                            for (var i = 0; i < channels.length; i++) {
                                strings.push(`Removing channel **${channels[i].name}**`)
                                channels[i].delete()
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + channels.length + " channels.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "setName":
                            var strings = []
                            for (var i = 0; i < channels.length; i++) {
                                strings.push(`Setting channel **${channels[i].name}** name to **${string}**`)
                                channels[i].setName(string)
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(10000);
                                msg.channel.send(userid + ", processing operation for " + channels.length + " channels.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        default:
                            msg.channel.send("", {
                                embed: {
                                    description: `${userid}, Usage: guild <module> <type> <string>`,
                                    footer: {
                                        text: `Types: setTopic, remove, setName`
                                    }
                                }
                            }).then(m => m.delete(delay * 4))
                            break;
                    }
                    break;
                case "roles":
                    var roles = msg.guild.roles.array();
                    switch (type) {
                        case "remove":
                            var strings = []
                            for (var i = 0; i < roles.length; i++) {
                                strings.push(`Removing **${roles[i].name}**`)
                                roles[i].delete();
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + roles.length + " roles.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        case "setPermissions":
                            var strings = []
                            for (var i = 0; i < roles.length; i++) {
                                strings.push(`Setting permissions for **${roles[i].name}** to **${string}**`)
                                roles[i].setPermissions([string]);
                            }
                            msg.channel.send(strings, {
                                split: true
                            }).then((m) => {
                                m.delete(delay * 4);
                                msg.channel.send(userid + ", processing operation for " + roles.length + " roles.. Please be patient.", {
                                    code: true
                                }).then(m => m.delete(delay * 4));
                            })
                            break;
                        default:
                            msg.channel.send("", {
                                embed: {
                                    description: `${userid}, Usage: guild <module> <type> <string>`,
                                    footer: {
                                        text: `Types: remove, setPermissions`
                                    }
                                }
                            }).then(m => m.delete(delay * 4))
                            break;
                    }
                    break;
                default:
                    msg.channel.send("", {
                        embed: {
                            description: `${userid}, Usage: guild <module> <type> <string>`,
                            footer: {
                                text: `Modules: members, channels, roles`
                            }
                        }
                    }).then(m => m.delete(delay * 4))
                    break;
            }
        } catch (err) {
            msg.channel.send(err, {
                code: "js"
            }).then(m => m.delete(delay * 4))
        }

    },
    'join': (msg) => {
        var channel = msg.member.voiceChannel;
        if (channel === undefined) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.username}, you must be in a voice channel.`
                }
            }).then(m => {
                m.delete(delay);
            });
        }
        msg.member.voiceChannel.join();
    },
    'play': (msg) => {
        try {
            var channel = msg.member.voiceChannel;
            var song = msg.content.split(' ').slice(1).join(' ');
            if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].repeat = false, queue[msg.guild.id].songs = [];
            if (channel === undefined) {
                return msg.channel.send('', {
                    embed: {
                        description: `${msg.author.username}, you must be in a voice channel.`
                    }
                }).then(m => {
                    m.delete(delay);
                });
            }
            if (song === undefined) {
                return commands.xplay(msg);
            }

            search(song, opts, function(err, results) {
                for (var i = 0; i < results.length; i++) {
                    var id = results[i].id
                    var url = 'https://www.youtube.com/watch?v=' + id
                    youtube.getInfo(url, (err, info) => {
                        if (err) return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.username}, failed to find video. Try using different words in your search.`
                            }
                        }).then(m => {
                            m.delete(delay);
                        });
                        queue[msg.guild.id].songs.push({
                            url: url,
                            title: info.title,
                            requester: msg.author.username
                        })
                        msg.channel.send('', {
                            embed: {
                                description: `Added **${info.title}** requested by **${msg.author.username}**`,
                            }
                        }).then(m => {
                            m.delete(delay);
                            commands.xplay(msg)
                        });
                    })
                }
            });
        } catch (err) {
            msg.channel.send(err, {
                code: "js"
            });
        }
    },
    'xplay': (msg) => {
        if (queue[msg.guild.id].playing) {
            return;
        }
        (function play(song) {
            if (song === undefined) {
                msg.member.voiceChannel.leave();
                return msg.channel.send('', {
                    embed: {
                        description: `The queue is empty.`
                    }
                }).then(m => {
                    m.delete(delay);
                });
            }
            queue[msg.guild.id].playing = true;
            msg.member.voiceChannel.join()
                .then(connection => {
                    if (queue[msg.guild.id].repeat) {
                        msg.channel.send('', {
                            embed: {
                                description: `Playing **${song.title}** requested by **${song.requester}** \`*Looping current song.*\`.`
                            }
                        }).then(m => {
                            m.delete(delay);
                        });
                    } else {
                        msg.channel.send('', {
                            embed: {
                                description: `Playing **${song.title}** requested by **${song.requester}**.`
                            }
                        }).then(m => {
                            m.delete(delay);
                        });
                    }

                    const stream = ytdl(song.url, {
                        filter: 'audioonly'
                    });
                    const dispatcher = connection.playStream(stream, streamOptions);

                    dispatcher.on('end', () => {
                        collector.stop();
                        queue[msg.guild.id].playing = false;
                        if (!queue[msg.guild.id].repeat) {
                            queue[msg.guild.id].songs.shift();
                        }
                        play(queue[msg.guild.id].songs[0]);
                    });
                    dispatcher.on('error', (err) => {
                        collector.stop();
						console.log(err);
                    });
                    dispatcher.on('debug', (info) => {
                        console.log(info);
                    });

                    let collector = msg.channel.createMessageCollector(m => m);
                    collector.on('collect', m => {
						sql.get(`SELECT * FROM guild where guildID = ?`, [msg.guild.id]).then(row => {
							if (m.content.startsWith(row.prefix + 'skip')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `The song was skipped.`
                                }
                            }).then(m => {
                                m.delete(delay);
                            });
                            dispatcher.end();
                        }
                        if (m.content.startsWith(row.prefix + 'bump')) {
                            if (m.content.split(' ')[1] === undefined) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please specify a song index to bump.`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            }
                            if (m.content.split(' ')[1] > queue[msg.guild.id].songs.length || m.content.split(' ')[1] < 2) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please enter a valid index. (Numbers between 2 - ${queue[msg.guild.id].songs.length}) (Must have 2 or more songs in queue.)`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            }
                            temp = queue[msg.guild.id].songs[1];
                            queue[msg.guild.id].songs[1] = queue[msg.guild.id].songs[m.content.split(' ')[1]];
                            queue[msg.guild.id].songs[m.content.split(' ')[1]] = temp;
                            dispatcher.end();
                        }
                        if (m.content.startsWith(row.prefix + 'time')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `The current song has been playing for ${dispatcher.time / 1000} seconds.`
                                }
                            }).then(m => {
                                m.delete(delay);
                            })
                        }
                        if (m.content.startsWith(row.prefix + 'clear')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `The queue has been cleared.`
                                }
                            }).then(m => {
                                m.delete(delay);
                            });
                            queue[msg.guild.id].songs = [];
                            dispatcher.end();
                        }
                        if (m.content.startsWith(row.prefix + 'remove')) {
                            if (m.content.split(' ')[1] === undefined) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please specify a song index to remove.`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            }
                            if (m.content.split(' ')[1] > queue[msg.guild.id].songs.length || m.content.split(' ')[1] < 1) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please enter a valid index. (Numbers between 1 - ${queue[msg.guild.id].songs.length}) (Must have at least 2 songs in queue)`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            }
                            msg.channel.send('', {
                                embed: {
                                    description: `Removed **${queue[msg.guild.id].songs[m.content.split(' ')[1]].title}**`
                                }
                            }).then(m => {
                                m.delete(delay);
                                queue[msg.guild.id].songs.splice(m.content.split(' ')[1], 1);
                            });
                            if (queue[msg.guild.id].songs[m.content.split(' ')[1]] === queue[msg.guild.id].songs[0]) {
                                dispatcher.end();
                            }
                        }
                        if (m.content.startsWith(row.prefix + 'volume')) {
                            if (m.content.split(' ')[1] > 100 || m.content.split(' ')[1] < 0) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `**Volume must be between** \`1 - 100\`**%**`
                                    }
                                }).then(m => m.delete(delay))
                            } else {
                                dispatcher.setVolume(Math.min((dispatcher.volume = parseInt(m.content.split(' ')[1])) / 50))
                                msg.channel.send('', {
                                    embed: {
                                        description: `**Volume:** \`${Math.round(dispatcher.volume*50)}\`**%**`
                                    }
                                }).then(m => m.delete(delay))
                            }
                        }
                        if (m.content.startsWith(row.prefix + 'pause')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `Current song paused.`
                                }
                            }).then(m => m.delete(delay))
                            dispatcher.pause();
                        }
                        if (m.content.startsWith(row.prefix + 'resume')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `Current song resumed.`
                                }
                            }).then(m => m.delete(delay))
                            dispatcher.resume();
                        }
                        if (m.content.startsWith(row.prefix + 'loop')) {
                            if (queue[msg.guild.id].repeat) {
                                queue[msg.guild.id].repeat = false;
                                msg.channel.send('', {
                                    embed: {
                                        description: `Looping current song is disabled.`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            } else {
                                queue[msg.guild.id].repeat = true;
                                msg.channel.send('', {
                                    embed: {
                                        description: `Looping current song is enabled.`
                                    }
                                }).then(m => {
                                    m.delete(delay);
                                });
                            }
                        }
						});
                    });
                })
                .catch(console.error);
        })(queue[msg.guild.id].songs[0])
    },
    'queue': (msg) => {
        if (queue[msg.guild.id] === undefined || queue[msg.guild.id].songs.length === 0) {
            return msg.channel.send('', {
                embed: {
                    description: `${msg.author.username}, no songs in queue.`
                }
            }).then(m => {
                m.delete(delay);
            });
        }
        var the_queue = [];
        for (var i = 0; i < queue[msg.guild.id].songs.length; i++) {
            if (i >= 15) {
                the_queue.push(`\n*Only displaying 15/${queue[msg.guild.id].songs.length}*`);
                break;
            }
            the_queue.push(i + '. **' + queue[msg.guild.id].songs[i].title + '** requested by **' + queue[msg.guild.id].songs[i].requester + '**');
        }
        msg.channel.send('', {
            embed: {
                title: `Queue for ${msg.guild.name}`,
                description: the_queue.join('\n').toString(),
                thumbnail: {
                    url: msg.guild.iconURL
                }
            }
        }).then(m => {
            m.delete(delay * 4);
        });
    }
}

client.on('debug', info => {
    //console.log(info)
});

client.on('message', msg => {
    if (msg.author.bot) return;

    if (msg.channel.type != "dm") {
        //SELECT FOR GUILD
        sql.get(`SELECT * FROM guild WHERE guildID = ?`, [msg.guild.id]).then(row => {
            if (!row) {
                sql.run(`INSERT INTO guild (guildID, prefix) VALUES (?, ?)`, [msg.guild.id, tokens.prefix]);
                console.log(`Inserted ${msg.guild.name} into 'guild' database.`);
            } else {
                //Client.on('message')
                if (row.prefix === null) {
                    sql.run(`UPDATE guild SET prefix = ? WHERE guildID = ?`, [tokens.prefix, msg.guild.id]);
                }
				
				if (msg.content.toLowerCase().startsWith(row.prefix + `checksettings`)) {
					var message = [
					  `Prefix: '${row.prefix}'`,
					  `Leveling Channel: '${row.levelChannel}'`,
					  `User Logging: '${row.logging}'`,
					  `Join Message: '${row.joinMessage}'`,
					  `Leave Message: '${row.leaveMessage}'`,
					  `Join Role: '${row.joinRole}'`,
					  `Streaming Role: '${row.streamingRole}'`
					];
					msg.channel.send(message, {code: "js"}).then(m => {
                        m.delete(delay * 5)
                    });
				}

                if (msg.content.toLowerCase().startsWith(row.prefix + `setprefix`)) {
                    var [string] = msg.content.split(' ').slice(1);
                    if (string === undefined) {
                        msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, specify a prefix to set.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    sql.run(`UPDATE guild SET prefix = ? WHERE guildID = ?`, [string, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, the new prefix was set.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                var check = msg.content.slice(msg.content.indexOf('>') + 2)
                var userid = msg.author.username + "#" + msg.author.discriminator;
                try {
                    if (msg.isMentioned(msg.member.guild.members.get("324279682444820481")) && check === "help") {
						if (msg.member.hasPermission("MANAGE_MESSAGES")) {
							msg.delete(delay);
						}
                        msg.channel.send(`My prefix is \`${row.prefix}\`, ex \`${row.prefix}help\``).then(m => m.delete(5000))
                    } else if (msg.isMentioned(msg.member.guild.members.get("324279682444820481"))) {
                        var errors = ['Do you know of any jokes?', 'Whats your favorite color?', 'Do you like pizza?', 'Whats the meaning of life?', 'Are you afraid of something?', 'I feel there is a deeper meaning behind this..', 'Now that I think of it, I think I\'m actually human.', 'I always wonder what flavor of ice cream best suits me.', 'Whats your favorite movie?', 'Are you a good little cupcake?', 'What would you do if it were the end of the world?']
                        var randomErrorCoverUp = errors[Math.floor(Math.random() * errors.length)]
                        var question = msg.content.slice(msg.content.indexOf('>') + 2)
                        clever.ask(question, function(err, response) {
                            if (response.includes('Error')) {
                                msg.channel.send(randomErrorCoverUp)
                            } else {
                                msg.channel.send(response)
                            }
                        })
                    }
                } catch (err) {

                }

                if (!msg.content.startsWith(row.prefix)) return;
                if (msg.content.startsWith(`${row.prefix}help`)) {
                    if (msg.channel.type === "text") {
                        msg.channel.send(userid + ", sent via DM", {
                            code: true
                        }).then(m => (m.delete(delay)))
                    }
                    var cmds = [
                        '\'Music\'',
                        'play',
                        'join',
                        'queue',
                        'time',
                        'volume',
                        'pause',
                        'resume',
                        'clear',
                        'bump',
                        'remove',
                        'loop',
                        '',
                        '\'Msc\'',
                        'info',
                        'purge',
                        'upload',
                        'geninvite',
                        'invite',
                        'donate',
                        '',
                        '\'Fun\'',
                        'cute',
                        'dog',
                        'fail',
                        'catball',
                        'anime',
                        'lets',
                        'mood',
                        '',
                        '\'Leveling\'',
                        'coins',
                        'profile',
                        'store',
                        'leaderboard',
                        'gift',
                        'challenge',
                        '',
                        '\'Unstable\'',
                        'guild',
                        'find',
                        '',
                        '\'Moderation\'',
                        'ban',
                        'softban',
                        'kick',
                        'mute',
                        'deafen',
                        '',
                        '\'Logging\'',
                        'joinrole',
                        'userlogging',
                        'joinmessage',
                        'leavemessage',
                        'streamingrole',
                        'setprefix',
						'checksettings'
                    ]
                    msg.author.send('', {
                        embed: {
                            description: `//` + userid + ", my current commands are..\n\n" + cmds.join('\n') + `\n//Prefix for all commands in ${msg.guild.name} is ${row.prefix}`
                        }
                    }).then(m => (m.react('🍰')))
                }
                if (msg.channel.type === "text") {
                    console.log(msg.guild.name + ": " + userid + ": " + msg.content);
                    if (msg.member.hasPermission("MANAGE_MESSAGES")) {
							msg.delete(delay / 2);
						}
                    if (commands.hasOwnProperty(msg.content.toLowerCase().slice(row.prefix.length).split(' ')[0])) {
                        commands[msg.content.toLowerCase().slice(row.prefix.length).split(' ')[0]](msg);
                    }
                }

                //Guild code.


                if (msg.content.toLowerCase().startsWith(row.prefix + 'userlogging')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var [channel] = msg.content.split(' ').slice(1);
                    if (channel === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, specify a channel name.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var channel = msg.guild.channels.find('name', channel);
                    sql.run(`UPDATE guild SET logging = ? WHERE guildID = ?`, [channel.id, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, logging enabled in ${channel.name}.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                if (msg.content.toLowerCase().startsWith(row.prefix + 'joinmessage')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var string = msg.content.split(' ').slice(1).join(' ');
                    if (string === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, usage: ${row.prefix}joinmessage %user% joined.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    sql.run(`UPDATE guild SET joinMessage = ? WHERE guildID = ?`, [string, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, join message updated.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                if (msg.content.toLowerCase().startsWith(row.prefix + 'leavemessage')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var string = msg.content.split(' ').slice(1).join(' ');
                    if (string === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, usage: ${row.prefix}joinmessage %user% left.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    sql.run(`UPDATE guild SET leaveMessage = ? WHERE guildID = ?`, [string, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, leave message updated.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                if (msg.content.toLowerCase().startsWith(row.prefix + 'joinrole')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var [args] = msg.content.split(' ').slice(1);
                    if (args === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, specify a role name.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var role = msg.guild.roles.find('name', args);
                    sql.run(`UPDATE guild SET joinRole = ? WHERE guildID = ?`, [role.id, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, giving role ${role.name} to users on join.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                if (msg.content.toLowerCase().startsWith(row.prefix + 'streamingrole')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var [args] = msg.content.split(' ').slice(1);
                    if (args === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, specify a role name.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var role = msg.guild.roles.find('name', args);
                    sql.run(`UPDATE guild SET streamingRole = ? WHERE guildID = ?`, [role.id, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, users that are streaming will get ${role.name} and if their no longer streaming, the role will be taken away.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }

                if (msg.content.toLowerCase().startsWith(row.prefix + 'levelchannel')) {
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, you need the adminstrator permission.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var [channel] = msg.content.split(' ').slice(1);
                    if (channel === undefined) {
                        return msg.channel.send('', {
                            embed: {
                                description: `${msg.author.tag}, specify a channel name.`
                            }
                        }).then(m => {
                            m.delete(delay)
                        });
                    }
                    var channel = msg.guild.channels.find('name', channel);
                    sql.run(`UPDATE guild SET levelChannel = ? WHERE guildID = ?`, [channel.id, msg.guild.id]);
                    msg.channel.send('', {
                        embed: {
                            description: `${msg.author.tag}, the level channel has been updated. You may now use level commands only in that channel.`
                        }
                    }).then(m => {
                        m.delete(delay)
                    });
                }


                if (row.levelChannel === undefined) return;
                if (msg.channel.id != row.levelChannel) {
                    return;
                }
                //SELECT FOR USER (level system)

                sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(row => {
                    if (msg.channel.type === 'DM') {
                        return;
                    }
                    if (!row) {
                        sql.run("INSERT INTO levelingsystem (userID, username, exp, level, coins, hero_health, hero_agility, hero_damage, hero_pet, structure_huts, structure_villages, structure_castles, structure_strongholds, structure_continents, structure_planets) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [msg.author.id, msg.author.username + '#' + msg.author.discriminator, 1, 0, 0, 100, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
                    } else {
                        //DECLARE THE VARS
                        var user = `${msg.author.username}#${msg.author.discriminator}`

                        var coins = ':small_blue_diamond:';
                        var error = ':anger:';
                        var success = ':joy_cat:';

                        var hero_health_upgrade = Math.floor(20 * Math.sqrt(row.hero_health)) + 100;
                        var hero_agility_upgrade = Math.floor(20 * Math.sqrt(row.hero_agility)) + 100;
                        var hero_damage_upgrade = Math.floor(20 * Math.sqrt(row.hero_damage)) + 100;
                        var hero_pet_upgrade = Math.floor(50 * Math.sqrt(row.hero_pet)) + 100;

                        var structure_huts_upgrade = Math.floor(100 * Math.sqrt(row.structure_huts)) + 100;
                        var structure_villages_upgrade = Math.floor(200 * Math.sqrt(row.structure_villages)) + 100;
                        var structure_castles_upgrade = Math.floor(400 * Math.sqrt(row.structure_castles)) + 100;
                        var structure_strongholds_upgrade = Math.floor(800 * Math.sqrt(row.structure_strongholds) + 100);
                        var structure_planets_upgrade = Math.floor(1600 * Math.sqrt(row.structure_planets) + 100);
                        var structure_continents_upgrade = Math.floor(3200 * Math.sqrt(row.structure_continents) + 100);

                        var moneyChance = Math.random() * 99 + 1;
                        if (moneyChance < 10) {
                            var coinsGained = Math.floor(Math.random() * 99 + 1);
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(coinsGained), msg.author.id]);
                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(result => {
                                msg.channel.send('', {
                                    embed: {
                                        description: `${user}, ノ( ゜-゜ノ) you found **${coinsGained}** ${coins}. Total: **${result.coins}** ${coins}`
                                    }
                                }).then(m => {
                                    m.delete(2000);
                                });
                            });
                        }

                        //STRUCTURE CURRENCY GAINS
                        var structure_huts_chance = Math.floor(Math.random() * 99) + 1;
                        var structure_villages_chance = Math.floor(Math.random() * 99) + 1;
                        var structure_castles_chance = Math.floor(Math.random() * 99) + 1;
                        var structure_strongholds_chance = Math.floor(Math.random() * 99) + 1;
                        var structure_planets_chance = Math.floor(Math.random() * 99) + 1;
                        var structure_continents_chance = Math.floor(Math.random() * 99) + 1;

                        var structure_huts_gain = row.structure_huts * 1;
                        var structure_villages_gain = row.structure_villages * 2;
                        var structure_castles_gain = row.structure_castles * 3;
                        var structure_strongholds_gain = row.structure_strongholds * 4;
                        var structure_planets_gain = row.structure_planets * 5;
                        var structure_continents_gain = row.structure_continents * 6;

                        if (structure_huts_chance < 20) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_huts_gain), msg.author.id]);
                        }

                        if (structure_villages_chance < 18) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_villages_gain), msg.author.id]);
                        }

                        if (structure_castles_chance < 16) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_castles_gain), msg.author.id]);
                        }

                        if (structure_strongholds_chance < 14) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_strongholds_gain), msg.author.id]);
                        }

                        if (structure_planets_chance < 12) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_planets_gain), msg.author.id]);
                        }

                        if (structure_continents_chance < 10) {
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins + parseInt(structure_continents_gain), msg.author.id]);
                        }

                        if (msg.content.startsWith(row.prefix + 'beta')) {
                            var beta = [
                                'Creatable Clans',
                                'Clan Leaders will be able to remove / add / promote users in their clan.',
                                'Clan Wars',
                                'Raiding',
                                'Adventure Mode',
                                'Random Encounters',
                                'Random Loot',
                                'Gift curreny to other users.',
                                'Create Clan Alliances.',
                                'Have more than 2 users in a given battle.',
                                'Better Battle System.',
                                'Sturctures auto gain currency, pet helps aid in combat, agility actually does something, option to opt out of battles (other person automatically wins)'
                            ];
                            msg.channel.send('', {
                                embed: {
                                    description: beta.join('\n')
                                }
                            })
                        }

                        //EXPERIENCE PER MESSAGE
                        var expGain = Math.floor(Math.random() * 9 + 1);
                        sql.run(`UPDATE levelingsystem SET exp = ? WHERE userID = ?`, [row.exp + parseInt(expGain), msg.author.id]);
                        var curLevel = Math.floor(0.1 * Math.sqrt(row.exp + 1));
                        if (curLevel > row.level) {
                            sql.run(`UPDATE levelingsystem SET level = ? WHERE userID = ?`, [row.level + 1, msg.author.id]);
                            msg.channel.send('', {
                                embed: {
                                    description: `${user}, your now level **${curLevel}**.`
                                }
                            }).then(m => {
                                m.delete(10000)
                            });
                        }

                        //GIFT CURRENCY
                        if (msg.content.toLowerCase().startsWith(row.prefix + 'gift')) {
                            var [id, amount] = msg.content.split(' ').slice(1);
                            if (id === undefined) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please enter a user ID to gift to. Usage: ${row.prefix}gift <user> <amount>`
                                    }
                                }).then(m => {
                                    m.delete(delay)
                                });
                            }
                            if (amount === undefined || amount < 0 || isNaN(amount)) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Please enter a valid amount.`
                                    }
                                }).then(m => {
                                    m.delete(delay)
                                });
                            }

                            if (row.coins < amount) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `You don't have that much to gift!`
                                    }
                                }).then(m => {
                                    m.delete(delay)
                                });
                            }

                            //the sending user
                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(amount), msg.author.id]);

                            //the receiving user
                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [id]).then(result => {
                                sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [result.coins + parseInt(amount), id]);
                                msg.channel.send('', {
                                    embed: {
                                        description: `${success} ${msg.author.username} sent ${amount} ${coins} to ${result.username}`
                                    }
                                }).then(m => {
                                    m.delete(delay)
                                });
                            });
                        }

                        //LEADERBOARD
                        if (msg.content.toLowerCase().startsWith(row.prefix + 'leaderboard')) {
                            var [amount] = msg.content.split(' ').slice(1)
                            if (amount === undefined) amount = 3;
                            if (amount > 15) return msg.channel.send('Values must be between 1 and 15')
                            if (amount < 1) return msg.channel.send('Values must be between 1 and 15')
                            if (isNaN(amount) === true) return msg.channel.send('Please enter a number for the amount')
                            sql.all(`SELECT * FROM levelingsystem`).then(results => {
                                if (amount < results.length) {
                                    amount = results.length;
                                }
                                if (amount > results.length) {
                                    amount = results.length;
                                }
                                var lb = []
                                var output = []
                                counter = 0;
                                for (var a = 0; a < results.length; a++) {
                                    lb.push({
                                        level: results[a].level,
                                        membername: results[a].username,
                                        coins: results[a].coins
                                    })
                                }
                                lb.sort((a, b) => b.level - a.level)
                                for (var limit = 0; limit < amount; limit++) {
                                    counter++
                                    output.push(lb[limit])
                                    output[limit] = `**${counter}.** \`${output[limit].membername}\` **Lvl:** \`${output[limit].level}\` **Coins:** \`${output[limit].coins}\`\n\n`
                                }
                                msg.channel.send(`__**Leaderboard**__ *[Displaying ${amount} of ${results.length}]*\n\n` + output.join(''))
                            })
                        }

                        //CHALLENGE A USER
                        if (msg.content.startsWith(row.prefix + 'challenge')) {
                            var args = msg.content.slice(row.prefix.length + 'challenge'.length + 1);
                            var user = client.users.find('username', args);
                            if (user === null) {
                                return msg.channel.send("(╯°□°）╯ Could not find that user.", {
                                    code: true
                                }).then(m => m.delete(delay));
                            }
                            if (user.bot) {
                                return msg.channel.send("(╯°□°）╯ We can not challenge bots :(", {
                                    code: true
                                }).then(m => m.delete(delay));
                            }
                            msg.channel.send("", {
                                embed: {
                                    description: `Shall we challenge this user? (Y / N)`,
                                    fields: [{
                                            name: "User",
                                            value: `${user.username}#${user.discriminator}`,
                                            inline: true
                                        },
                                        {
                                            name: "ID",
                                            value: user.id,
                                            inline: true
                                        },
                                        {
                                            name: "Status",
                                            value: user.presence.status,
                                            inline: true
                                        }
                                    ],
                                    thumbnail: {
                                        url: user.avatarURL
                                    },
                                    footer: {
                                        text: `${userid}, We have found the user!`,
                                        icon_url: msg.author.avatarURL
                                    }
                                }
                            }).then(m => m.delete(delay * 4));
                            var attacker = msg.author;
                            var defender = user;
                            let attacker_collector = msg.channel.createMessageCollector(m => m);
                            attacker_collector.on('collect', m => {
                                if (m.author.id === attacker.id) {
                                    if (m.content.toLowerCase().startsWith('y')) {
                                        attacker_collector.stop();
                                        msg.channel.send(`Okay, now <@${defender.id}> must also type 'Y'..`);
                                        let defender_collector = msg.channel.createMessageCollector(m => m);
                                        defender_collector.on('collect', m => {
                                            if (m.author.id === defender.id) {
                                                if (m.content.toLowerCase().startsWith('y')) {
                                                    defender_collector.stop();
                                                    msg.channel.send(`${attacker.username} and ${defender.username}, the battle is about to begin!! Type 'attack' to attack your enemies!!`)


                                                    sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [attacker.id]).then(atck => {
                                                        sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [defender.id]).then(dfnd => {
                                                            //LET THE BATTLE BEGIN!!
                                                            var defender_hp = dfnd.hero_health;
                                                            var attacker_hp = atck.hero_health;

                                                            var defender_pet = (Math.floor(Math.random() * 99) + 1);
                                                            var attacker_pet = (Math.floor(Math.random() * 99) + 1);

                                                            var attacker_turn = false;
                                                            msg.channel.send(`${attacker.username} HP: ${attacker_hp}\n${defender.username} HP: ${defender_hp}`).then(m => {
                                                                m.delete(5000)
                                                            })
                                                            let turn = msg.channel.createMessageCollector(m => m);
                                                            turn.on('collect', m => {
                                                                if (m.author.id === attacker.id) {
                                                                    //the attacker
                                                                    if (!attacker_turn) {
                                                                        return msg.channel.send(`${attacker.username}, it's not your turn.`)
                                                                    }
                                                                    if (m.content.toLowerCase().startsWith('attack')) {
                                                                        //ATTACK (ATTACKER)
                                                                        attacker_turn = false;
                                                                        if (attacker_pet < 20) {
                                                                            var pet_damage = Math.floor(atck.hero_pet + Math.floor(Math.random() * 9 + 1))
                                                                            defender_hp -= pet_damage
                                                                            msg.channel.send(`${attacker.username}, your pet did ${pet_damage} to ${defender.username}!!`)
                                                                        }
                                                                        defender_hp -= (atck.hero_damage + Math.floor(Math.random() * 9 + 1));
                                                                        msg.channel.send(`${attacker.username} HP: ${attacker_hp}\n${defender.username} HP: ${defender_hp}`).then(m => {
                                                                            m.delete(5000)
                                                                        })
                                                                    }
                                                                }
                                                                if (m.author.id === defender.id) {
                                                                    //the defender
                                                                    if (attacker_turn) {
                                                                        return msg.channel.send(`${defender.username}, it's not your turn.`)
                                                                    }
                                                                    if (m.content.toLowerCase().startsWith('attack')) {
                                                                        //ATTACK (DEFENDER)
                                                                        attacker_turn = true;

                                                                        if (defender_pet < 20) {
                                                                            var pet_damage = Math.floor(dfnd.hero_pet + Math.floor(Math.random() * 9 + 1))
                                                                            attacker_hp -= pet_damage
                                                                            msg.channel.send(`${defender.username}, your pet did ${pet_damage} to ${attacker.username}!!`)
                                                                        }

                                                                        attacker_hp -= (dfnd.hero_damage + Math.floor(Math.random() * 9 + 1));
                                                                        msg.channel.send(`${attacker.username} HP: ${attacker_hp}\n${defender.username} HP: ${defender_hp}`).then(m => {
                                                                            m.delete(5000)
                                                                        })
                                                                    }
                                                                }

                                                                if (defender_hp < 0) {
                                                                    turn.stop();
                                                                    msg.channel.send(`${attacker.username} wins with ${attacker_hp} HP remaning!`)
                                                                }
                                                                if (attacker_hp < 0) {
                                                                    turn.stop();
                                                                    msg.channel.send(`${defender.username} wins with ${defender_hp} HP remaining!`)
                                                                }
                                                            });


                                                        })

                                                    })

                                                }
                                                if (m.content.toLowerCase().startsWith('n')) {
                                                    defender_collector.stop();
                                                    msg.channel.send(`${defender.username} has denied the challenge!`)
                                                }
                                            }
                                        });
                                    }
                                    if (m.content.toLowerCase().startsWith('n')) {
                                        attacker_collector.stop();
                                        msg.channel.send('Alright, we are no longer challenging this user.');
                                    }
                                }
                            });
                        }

                        //COINS
                        if (msg.content.toLowerCase().startsWith(row.prefix + 'coins')) {
                            msg.channel.send('', {
                                embed: {
                                    description: `${user}, your balance is **${row.coins}** ${coins}`
                                }
                            }).then(m => {
                                m.delete(delay);
                            });
                        }

                        //PROFILE
                        if (msg.content.toLowerCase().startsWith(row.prefix + 'profile')) {
                            var [type] = msg.content.toLowerCase().split(' ').slice(1);
                            if (type === undefined) {
                                return msg.channel.send('', {
                                    embed: {
                                        description: `Usage: ${row.prefix}profile <type>`,
                                        footer: {
                                            text: `Types: main, structures, hero, special`
                                        }
                                    }
                                })
                            }
                            switch (type) {
                                case 'main':
                                    msg.channel.send('', {
                                        embed: {
                                            title: `__${user}'s Main Profile__`,
                                            fields: [{
                                                    name: `**Balance**`,
                                                    value: `**${row.coins}** ${coins}`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Total Structures**`,
                                                    value: `*Gain Money Automatically - Soon to Come*`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Fame**`,
                                                    value: `*Overall Effectiveness Multiplier - Soon to Come*`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Achievements**`,
                                                    value: `*soon to come..*`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Overall Calculated Rank**`,
                                                    value: `*soon to come*`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Level**`,
                                                    value: `**${row.level}**`,
                                                    inline: true
                                                }
                                            ]
                                        }
                                    }).then(m => {
                                        m.delete(delay * 4);
                                    })
                                    break;
                                case 'hero':
                                    msg.channel.send('', {
                                        embed: {
                                            title: `__${user}'s Hero Profile__`,
                                            fields: [{
                                                    name: `**Hero Health**`,
                                                    value: `**${row.hero_health}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Hero Agility**`,
                                                    value: `**${row.hero_agility}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Hero Damage**`,
                                                    value: `**${row.hero_damage}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Hero Pet**`,
                                                    value: `**${row.hero_pet}**`,
                                                    inline: true
                                                }
                                            ]
                                        }
                                    }).then(m => {
                                        m.delete(delay * 4);
                                    })
                                    break;
                                case 'structures':
                                    msg.channel.send('', {
                                        embed: {
                                            title: `__${user}'s Structures Profile__`,
                                            description: `*Sturctures automatically produce curreny overtime.*`,
                                            fields: [{
                                                    name: `**Huts**`,
                                                    value: `**${row.structure_huts}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Villages**`,
                                                    value: `**${row.structure_villages}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Castles**`,
                                                    value: `**${row.structure_castles}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Strongholds**`,
                                                    value: `**${row.structure_strongholds}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Continents**`,
                                                    value: `**${row.structure_continents}**`,
                                                    inline: true
                                                },
                                                {
                                                    name: `**Planets**`,
                                                    value: `**${row.structure_planets}**`,
                                                    inline: true
                                                }
                                            ]
                                        }
                                    }).then(m => {
                                        m.delete(delay * 4);
                                    })
                                    break;
                                case 'special':
                                    msg.channel.send('under development - more info at https://discord.gg/3azJwb5')
                                    break;
                                default:
                                    break;
                            }

                        }

                        //STORE
                        if (msg.content.toLowerCase().startsWith(row.prefix + 'store')) {
                            var [store, upgrade, amount] = msg.content.toLowerCase().split(' ').slice(1);
                            if (amount === undefined || amount < 0 || isNaN(amount)) {
                                amount = 1;
                            }
                            if (store === undefined) {
                                msg.channel.send('', {
                                    embed: {
                                        description: `${user}, welcome to the upgrade store!\n\nUsage: ${row.prefix}store <store>`,
                                        footer: {
                                            text: `Stores: hero, structures, clan, special`
                                        }
                                    }
                                }).then(m => {
                                    m.delete(delay * 4)
                                })
                            }
                            switch (store) {
                                //HERO STORE
                                case 'hero':
                                    if (upgrade === undefined) {
                                        return msg.channel.send('', {
                                            embed: {
                                                title: '__Hero Upgrade Menu__',
                                                description: `${user}, you have **${row.coins}** ${coins}.`,
                                                fields: [{
                                                        name: 'Health',
                                                        value: `Cost **${hero_health_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Agility',
                                                        value: `Cost **${hero_agility_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Damage',
                                                        value: `Cost **${hero_damage_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Pet',
                                                        value: `Cost **${hero_pet_upgrade}** ${coins}`,
                                                        inline: true
                                                    }
                                                ],
                                                footer: {
                                                    text: `Usage: ${row.prefix}store hero <upgrade> <amount>`
                                                },
                                                thumbnail: {
                                                    url: msg.author.avatarURL
                                                }
                                            }
                                        }).then(m => {
                                            m.delete(delay * 4)
                                        })
                                    }

                                    switch (upgrade) {
                                        case 'health':
                                            var cost = hero_health_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET hero_health = ? WHERE userID = ?`, [row.hero_health + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and ${results.hero_health} hero health.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'agility':
                                            var cost = hero_agility_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET hero_agility = ? WHERE userID = ?`, [row.hero_agility + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and ${results.hero_agility} hero agility.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'damage':
                                            var cost = hero_damage_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET hero_damage = ? WHERE userID = ?`, [row.hero_damage + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and ${results.hero_damage} hero damage.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'pet':
                                            var cost = hero_pet_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET hero_pet = ? WHERE userID = ?`, [row.hero_pet + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and your pet is now level ${results.hero_pet}.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                    //STRUCTURES STORE
                                case 'structures':
                                    if (upgrade === undefined) {
                                        return msg.channel.send('', {
                                            embed: {
                                                title: '__Structures Upgrade Menu__',
                                                description: `${user}, whata'ya buying? You have **${row.coins}** ${coins}.`,
                                                fields: [{
                                                        name: 'Hut',
                                                        value: `Cost **${structure_huts_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Village',
                                                        value: `Cost **${structure_villages_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Castle',
                                                        value: `Cost **${structure_castles_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Stronhold',
                                                        value: `Cost **${structure_strongholds_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Planet',
                                                        value: `Cost **${structure_planets_upgrade}** ${coins}`,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Continent',
                                                        value: `Cost **${structure_continents_upgrade}** ${coins}`,
                                                        inline: true
                                                    }
                                                ],
                                                footer: {
                                                    text: `ex: ${row.prefix}store structures <upgrade> <amount>`
                                                },
                                                thumbnail: {
                                                    url: msg.author.avatarURL
                                                }
                                            }
                                        }).then(m => {
                                            m.delete(delay * 4)
                                        })
                                    }
                                    switch (upgrade) {
                                        case 'hut':
                                            var cost = structure_huts_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_huts = ? WHERE userID = ?`, [row.structure_huts + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_huts} huts.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'village':
                                            var cost = structure_villages_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_villages = ? WHERE userID = ?`, [row.structure_villages + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_villages} villages.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'castle':
                                            var cost = structure_castles_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_castles = ? WHERE userID = ?`, [row.structure_castles + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_castles} castles.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'stronghold':
                                            var cost = structure_strongholds_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_strongholds = ? WHERE userID = ?`, [row.structure_strongholds + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_strongholds} villages.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'planet':
                                            var cost = structure_planets_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_planets = ? WHERE userID = ?`, [row.structure_planets + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_planets} planets.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        case 'continent':
                                            var cost = structure_continents_upgrade * amount;
                                            if (row.coins < cost) {
                                                return msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you need ${cost} ${coins}`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            }

                                            sql.run(`UPDATE levelingsystem SET coins = ? WHERE userID = ?`, [row.coins - parseInt(cost), msg.author.id]);
                                            sql.run(`UPDATE levelingsystem SET structure_continents = ? WHERE userID = ?`, [row.structure_continents + parseInt(amount), msg.author.id]);
                                            sql.get(`SELECT * FROM levelingsystem WHERE userID = ?`, [msg.author.id]).then(results => {
                                                msg.channel.send('', {
                                                    embed: {
                                                        description: `${user}, you now have ${results.coins} ${coins} and you now have ${results.structure_continents} continents.`
                                                    }
                                                }).then(m => {
                                                    m.delete(delay);
                                                })
                                            });
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case 'clan':
                                    switch (upgrade) {
                                        default: break;
                                    }
                                    break;
                                case 'special':
                                    switch (upgrade) {
                                        default: break;
                                    }
                                    break;
                                default:
                                    break;
                            }

                            //Commit

                        }
                    }
                }).catch(() => {
                    console.error;
                    sql.run("CREATE TABLE IF NOT EXISTS levelingsystem (userID TEXT, username TEXT, exp INTEGER, level INTEGER, coins INTEGER, hero_health INTEGER, hero_agility INTEGER, hero_damage INTEGER, hero_pet INTEGER, structure_huts INTEGER, structure_villages INTEGER, structure_castles INTEGER, structure_strongholds INTEGER, structure_continents INTEGER, structure_planets INTEGER)").then(() => {
                        sql.run("INSERT INTO levelingsystem (userID, username, exp, level, coins, hero_health, hero_agility, hero_damage, hero_pet, structure_huts, structure_villages, structure_castles, structure_strongholds, structure_continents, structure_planets) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [msg.author.id, msg.author.username + '#' + msg.author.discriminator, 1, 0, 0, 100, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
                    });
                });
            }
        }).catch(() => {
            console.error;
            myCatch();
        });


    }




    if (msg.channel.type === "dm") {
        var errors = ['Do you know of any jokes?', 'Whats your favorite color?', 'Do you like pizza?', 'Whats the meaning of life?', 'Are you afraid of something?', 'I feel there is a deeper meaning behind this..', 'Now that I think of it, I think I\'m actually human.', 'I always wonder what flavor of ice cream best suits me.', 'Whats your favorite movie?', 'Are you a good little cupcake?', 'What would you do if it were the end of the world?']
        var randomErrorCoverUp = errors[Math.floor(Math.random() * errors.length)]
        var question = msg.content;
        clever.ask(question, function(err, response) {
            if (response.includes('Error')) {
                msg.channel.send(randomErrorCoverUp)
            } else {
                msg.channel.send(response)
            }
        })
    }
    if (msg.content.startsWith('┬─┬﻿ ノ( ゜-゜ノ)')) {
        msg.channel.send('(╯°□°）╯︵ ┻━┻').then(m => m.delete(5000));
    }
    if (msg.content.startsWith('(╯°□°）╯︵ ┻━┻')) {
        msg.channel.send('┬─┬﻿ ノ( ゜-゜ノ)').then(m => m.delete(5000));
    }
    if (msg.content === "valk") {
        msg.react('🐱');
    }

});

client.login(tokens.token.vlesta);

function secondsToTime(secs) {
    secs = secs / 1000
    var hours = Math.floor(secs / (60 * 60))
    var divisor_for_minutes = secs % (60 * 60)
    var minutes = Math.floor(divisor_for_minutes / 60)
    var divisor_for_seconds = divisor_for_minutes % 60
    var seconds = Math.ceil(divisor_for_seconds)
    if (minutes === 0) return seconds + 's'
    if (hours === 0) return minutes + 'm ' + seconds + 's'
    return hours + 'h ' + minutes + 'm ' + seconds + 's'
}