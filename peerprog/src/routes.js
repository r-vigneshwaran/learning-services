import { ping, sendSms, recieveSms, getUsers } from './controller/SmsController'

var router = require('express').Router()
var bodyParser = require('body-parser')

router.use(bodyParser.urlencoded({ extended: false }))
router.get('/', ping)
router.get('/sendsms', sendSms)
router.post('/recievesms', recieveSms)
router.get('/getusers', getUsers)

module.exports = router