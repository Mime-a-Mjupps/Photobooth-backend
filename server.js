// Require the framework and instantiate it
require("dotenv").config();
const fastify = require('fastify')({ logger: true, bodyLimit: 30 * 1024 * 1024 });
const fastifyStatic = require('@fastify/static');
const fastifyCors = require('@fastify/cors');
const fastifyFormbody = require('@fastify/formbody');
const shortid = require('shortid');
const base64toFile = require('node-base64-to-file').default;
const path = require('path');
const pkginfo = require('./package.json');
// Let´s load out env variables needed.
const {
    MONGODB_USER,
    MONGODB_PASSWORD,
    DB_HOST,
    DB_PORT,
    MONGODB_DATABASE,
    UPLOAD_KEY
} = process.env;
// MongoDB stuff - lets get our database up and rolling
const mongoose = require('mongoose');
mongoose.connect(`mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${DB_HOST}:${DB_PORT}/${MONGODB_DATABASE}?authSource=admin`);
// Photobooth model for db stuff.
const Photosession = mongoose.model('Photosession', { timeTaken: Date, shortId: String, photoPath: String, videoPath: String })
// Let´s declare the static content.
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'static'),
    prefix: '/static/', // optional: default '/'
});
// Let´s declare the pictures.
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'content'),
    prefix: '/content/', // optional: default '/'
    decorateReply: false
});
// Let´s load our plugins
fastify.register(fastifyCors, (instance) => {
    return (req, callback) => {
        const corsOptions = {
            // This is NOT recommended for production as it enables reflection exploits
            origin: true
        };
        // do not include CORS headers for requests from localhost
        if (/^localhost$/m.test(req.headers.origin)) {
            corsOptions.origin = false
        }
        // callback expects two parameters: error and options
        callback(null, corsOptions)
    }
});
// Let´s allow us to upload big files...
fastify.register(fastifyFormbody, { bodyLimit: 52428800 });
// Let´s load our templating engine!
fastify.register(require("@fastify/view"), {
    engine: {
        ejs: require("ejs"),
    },
});
// Declare main route
fastify.get('/', async (req, reply) => {
    return { status: 'running', version: pkginfo.version, author: pkginfo.author }
});
//Upload route
fastify.post('/upload', async (req, reply) => {
    if (req.body.key != UPLOAD_KEY) {
        reply.send({ error: "No API key provided.." })
    }
    //Generate id.(TODO: add check if it exists...)
    let uniqId = shortid().replace("-", "A").replace("_", "B");
    //If key match, then allow save...
    let picLoc = await base64toFile(req.body.picture, { filePath: './content', fileName: uniqId });
    let vidLoc = await base64toFile(req.body.video, { filePath: './content', fileName: uniqId });
    // TODO: Add reencoding of webm to mp4 here instead of relying on ffmpeg and a file watcher.
    let photosess = new Photosession({ timeTaken: new Date(), shortId: uniqId, photoPath: picLoc, videoPath: vidLoc.replace("webm", "mp4") });
    await photosess.save();
    reply.send({ status: 200, id: uniqId });
});
//Show route
fastify.get('/:linkId', async (req, reply) => {
    const { linkId } = req.params;
    let sess = await Photosession.findOne({ shortId: linkId });
    if (!sess) {
        await reply.view("/templates/notfound.ejs", {});
    } else {
        await reply.view("/templates/show.ejs", { data: { pic: sess.photoPath, vid: sess.videoPath } });
    }
});
// Run the server!
const start = async () => {
    try {
        await fastify.listen({ port: 8888, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
