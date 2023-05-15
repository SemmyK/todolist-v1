module.exports = findDay

//get day function
function findDay() {
	let options = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}
	let today = new Date()
	let day = today.toLocaleDateString('en-US', options)
	return day
}
