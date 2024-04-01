require('dotenv').config();

console.log(process.env.DB_URI);

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const { Schema } = mongoose;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.DB_URI);
}

const userSchema = new Schema({
    username: { type: String, require: true, unique: true },
    exercises: [{
        description: String,
        duration: Number,
        date: Date
    }]
}, { versionKey: false });

const User = mongoose.model('User', userSchema);
const ERROR = { error: "There was an error while getting the users." };

app.get('/api/users', async (req, res) => {
    try {
        const data = await User.find({});
        res.json(data);
    } catch (err) {
        res.send(ERROR);
    }
});

app.get('/api/users/:id/logs', async (req, res) => {
    const id = req.params.id;
    const dateFrom = req.query.from ? new Date(req.query.from) : new Date(0);
    const dateTo = req.query.to ? new Date(req.query.to) : new Date();
    const limit = parseInt(req.query.limit);

    try {
        const data = await User.findOne({ _id: new ObjectId(id) });
        const log = data.exercises
            .filter(exercise => exercise.date >= dateFrom && exercise.date <= dateTo)
            .map(exercise => ({
                description: exercise.description,
                duration: exercise.duration,
                date: exercise.date.toDateString()
            }));

        const logWithLimit = limit ? log.slice(0, limit) : log;

        res.json({
            _id: data._id,
            username: data.username,
            count: log.length,
            log: logWithLimit
        });
    } catch (err) {
        res.send(ERROR);
    }
});

app.post('/api/users', async (req, res) => {
    const { username } = req.body;
    try {
        const data = await User.create({ username: username });
        res.json({ _id: data._id, username: data.username });
    } catch (err) {
        res.send(ERROR);
    }
});

app.post('/api/users/:id/exercises', async (req, res) => {
  const id = req.params.id;
  const { description, duration, date } = req.body;

  const newExercise = {
      description: description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
  };

  try {
      const user = await User.findOne({ _id: new ObjectId(id) });
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      user.exercises.push(newExercise);
      await user.save();

      res.json(user); // Return the entire user object with exercises added
  } catch (err) {
      res.status(500).json({ error: "Server error" });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port);
});

