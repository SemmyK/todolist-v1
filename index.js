require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const date = require(__dirname + '/getDateString')
const PORT = process.env.PORT || 3000

//connect to atlas DB
const uri = process.env.MONGO_URI

const app = express()
app.use(express.static('./public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

//global vars
let day = date()
let toDoTitle = ''

//create MongoDB database
const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI)
		console.log(`MongoDB Connected: ${conn.connection.host}`)
	} catch (error) {
		console.log(error)
		process.exit(1)
	}
}

//create a SCHEMA that sets out the fields each document will have and their datatypes
const itemsSchema = new mongoose.Schema({
	taskName: {
		type: String,
		required: [true, 'No name specified!'],
	},
	taskTime: {
		type: String,
	},
})

const listSchema = {
	name: {
		type: String,
		required: true,
	},
	items: [itemsSchema],
}

//create a MODELS
const Item = new mongoose.model('Item', itemsSchema)
const List = new mongoose.model('List', listSchema)
const Home = new mongoose.model('homeTask', itemsSchema)
const Work = new mongoose.model('workTask', itemsSchema)

//create default documents

const wellcome = new Item({
	taskName: 'Welcome',
	taskTime: '',
})
const insertTask = new Item({
	taskName: 'Insert your first todo item',
	taskTime: '',
})

let defaultArr = [wellcome, insertTask]

// home get request
app.get('/', (req, res) => {
	toDoTitle = 'Home'

	if (res.statusCode === 200) {
		//get tasks from DB collection home

		Home.find()
			.then(function (hometasks) {
				if (hometasks.length === 0) {
					// Function call
					Home.insertMany(defaultArr)
						.then(function () {
							console.log('Data inserted') // Success
							res.redirect('/')
						})
						.catch(function (error) {
							console.log(error) // Failure
						})
				} else {
					res.render('list', {
						listTitle: toDoTitle,
						dayName: day,
						tasks: hometasks,
					})
				}
			})
			.catch(function (err) {
				console.log(err)
			})
	} else {
		console.log('not getting DB tasks')
	}
})

//work get request
app.get('/work', (req, res) => {
	toDoTitle = 'Work'

	//get tasks from DB collection work
	Work.find()
		.then(function (worktasks) {
			if (worktasks.length === 0) {
				// Function call
				Work.insertMany(defaultArr)
					.then(function () {
						console.log('Data inserted') // Success
						res.redirect('/work')
					})
					.catch(function (error) {
						console.log(error) // Failure
					})
			} else {
				res.render('list', {
					listTitle: toDoTitle,
					dayName: day,
					tasks: worktasks,
				})
			}
		})
		.catch(function (err) {
			console.log(err)
		})
})

//dinamic routes
app.get('/:name', (req, res) => {
	if (res.statusCode === 200) {
		//get capitalised name
		let newList = req.params.name
		let firstLetter = newList[0].toUpperCase()
		newList = newList.replace(newList[0], firstLetter)

		List.findOne({ name: newList })
			.then(foundList => {
				if (!foundList) {
					//Create a new list
					const list = new List({
						name: newList,
						items: defaultArr,
					})
					list.save()
					res.redirect('/' + newList.toLowerCase())
					console.log('does not exist')
				} else {
					//show existing list
					
					res.render('list', {
						listTitle: foundList.name,
						dayName: day,
						tasks: foundList.items,
					})
					console.log('exists')
				}
			})
			.catch(err => {
				console.log(err)
			})
	}
})

//post request
app.post('/', (req, res) => {
	if (res.statusCode === 200) {
		let taskItem
		//get data from form
		let task = req.body.newTask
		let taskTime = req.body.newTime
		let listType = req.body.list

		if (taskTime === '') {
			taskTime = 'Time not specified'
		}

		if (listType === 'Work') {
			//create a DOCUMENT
			taskItem = new Work({
				taskName: task,
				taskTime: taskTime,
			})
			res.redirect('/work')
		} else if (listType === 'Home') {
			//create a DOCUMENT
			taskItem = new Home({
				taskName: task,
				taskTime: taskTime,
			})

			res.redirect('/')
		} else {
			taskItem = new Item({
				taskName: task,
				taskTime: taskTime,
			})

			List.findOne({ name: listType }).then(foundList => {
				foundList.items.push(newItem)
				foundList.save()
				res.redirect('/' + listType.toLowerCase())
			})
		}

		taskItem.save()
	} else {
		console.log(req.statusMessage)
	}
})

app.post('/delete', (req, res) => {
	const checkedTask = req.body.checkbox
	const listName = req.body.listTitle

	if (listName === 'Home') {
		//get whole collection as array of objects
		Home.findByIdAndRemove(checkedTask)
			.then(() => {
				console.log('Home successfully deleted ' + checkedTask)
				res.redirect('/')
			})
			.catch(function (err) {
				console.log(err)
			})
	} else if (listName === 'Work') {
		Work.findByIdAndRemove(checkedTask)
			.then(() => {
				console.log('Work successfully deleted ' + checkedTask)
				res.redirect('/work')
			})
			.catch(function (err) {
				console.log(err)
			})
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedTask } } }
		)
			.then(foundList => {
				console.log(foundList)
				res.redirect('/' + listName.toLowerCase())
			})
			.catch(function (err) {
				console.log(err)
			})
	}
})

//Connect to the database before listening
connectDB().then(() => {
	app.listen(PORT, () => {
		console.log('listening for requests')
	})
})
