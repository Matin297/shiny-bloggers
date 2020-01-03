import express from 'express'
import { MongoClient } from 'mongodb'
import bodyParser from 'body-parser'
import path from 'path'

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());


const connectionURL = 'mongodb://127.0.0.1:27017';
const dbName = 'react-blog';

const withDB = async (operations, res) => {

    try {

        const client = await MongoClient.connect(connectionURL, { useUnifiedTopology: true });

        const db = client.db(dbName);

        await operations(db);

        client.close();

    } catch (error) {
        res.status(500).json({ message: "Somthing Went wrong in the server", error })
    }

}

app.get('/api/articles/:name', async (req, res) => {

    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articleInfo);
    }, res)

})

app.post('/api/articles/:name/upvote', async (req, res) => {

    const articleName = req.params.name;


    withDB(async (db) => {

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, { '$set': { upvotes: articleInfo.upvotes + 1 } });
        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticlesInfo);

    }, res)
})

app.post('/api/articles/:name/add-comment', async (req, res) => {

    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {

        await db.collection('articles').findOneAndUpdate({ name: articleName }, {
            '$push': { comments: { username, text } }
        });

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);

    }, res)

})

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '/build/index.html')));

app.listen(8000, () => console.log('Server is up and running on port 8000.'));