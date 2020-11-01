var express =  require('express');
var mysql  = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var { check, validationResult } = require('express-validator/check');
var session = require('express-session');
var mailer = require('express-mailer');
app.use(express.static('public'));
mailer.extend(app, {
  from: 'no-reply@galdermamiddleast.com',
  host: 'in-v3.mailjet.com', // hostname
  secureConnection: false, // use SSL
  port: 587, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: '5cf69fab2a134d73fd33e9b1d25708b7',
    pass: 'db308f5ace974b5d4a2d009700aaf1f7'
  }
});
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
    }
    next()
});
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
      console.log(file);
      var filetype = '';
      if(file.mimetype === 'image/gif') {
        filetype = 'gif';
      }
      if(file.mimetype === 'image/png') {
        filetype = 'png';
      }
      if(file.mimetype === 'image/jpeg') {
        filetype = 'jpg';
      }
      cb(null, 'image-' + Date.now() + '.' + filetype);
    }
});
var upload = multer({storage: storage});
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//********Database Parameter************//
var connection =mysql.createConnection({
    //properties
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'merck'
});
//********Database Parameter************//
//********Database Connection************//
connection.connect(function(error){
    if(!!error){
        console.log('error');
    } else {
        console.log('connected');
    }
});

app.get('/sendmail', function (req, res, next) {
  app.mailer.send('email', {
    to: 'akhil.kaliyar1992@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
    subject: 'Set Your Password', // REQUIRED.
    otherProperty: 'Link to forgot your password http://localhost:4200/appuser', // All additional properties are also passed to the template as local variables.
	}, function (err) {
    if (err) {
      // handle error
      console.log(err);
      res.send('There was an error sending the email');
      return;
    }
    res.send('Email Sent');
  });
});
//************forgot password**************//
app.post('/forgot' ,function(req, res){
	var email= req.body.email;
    connection.query("select * from mr_users where email = ?" ,[email] ,function(error, result , fields){
        //console.log(error);
		if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				userid =result[0].id;
				//console.log(userid);return;
				app.mailer.send('email', {
					//to: 'akhil.kaliyar1992@gmail.com', // REQUIRED. This can be a comma delimited string just like a normal email to field. 
					to: email, // REQUIRED. This can be a comma delimited string just like a normal email to field. 
					subject: 'Forgot Password', // REQUIRED.
					otherProperty: "Link to forgot your password http://localhost:4200/forgot/"+userid // All additional properties are also passed to the template as local variables.
				}, function (err) {
					if (err) {
					  // handle error
					  console.log(err);
					  res.send({
						  "code":200,
						  "message":"There was an error sending the email",
						  "status":2,
						});
						return;
					}
					res.send({
					  "code":200,
					  "message":"email send sucuessfully on register email",
					  "status":1,
					});
				});
				
			}else{
				res.send({
				  "code":200,
				  "message":"user doesn't exit in our record",
				  "status":3,
				});
			}
			//console.log(result);
        } 
    });
});
//************forgot password**************//

//********Database Connection************//
app.post('/upload',upload.single('file'),function(req, res, next) {
  console.log(req.file);
  if(!req.file) {
    res.status(500);
    return next(err);
  }
  res.json({ fileUrl: req.file.path });
})
//********All User List************//
app.get('/alldata' ,function(req, res){
	
	var sql ="SELECT u.id,u.mobile,u.country,u.city,h.name_en,h.name_ar,u.fname,u.lname,u.email,u.usertype FROM mr_users as u JOIN mr_hospital as h ON u.	hospital = h.id where u.usertype !='1'";
    connection.query(sql ,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
            res.send({
				  "message":"User List",
				  "status":'1',
				  "data":result
				});
        } 
    });
});
//********All User List************//
//********All User Detail************//
app.post('/alldatabyuser' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from mr_users where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":2,
				  "data":result
				});
			}
			//console.log(result);
        } 
    });
});
//********All User Detail************//
//********User Register ************//
app.post('/setpassword', function(req, res){
	var saltRounds = 10;
	var password=req.body.password;
	var cpassword=req.body.cpassword;
	var id=req.body.id;
	if(password == cpassword)
	{
		bcrypt.hash(req.body.password, saltRounds, function (err,hash) {
			var users={
				"password":hash,
				"expirelink":1,
			}
			connection.query("select * from mr_users where id = ?" ,[id], function (error, result, fields) 
			{
				if (error) 
				{
					res.send({
					  "status":3,
					  "failed":"Something went wrong!!!"
					})
				}else
				{
					numRows = result.length;
					if(numRows > 0)
					{
						connection.query('update mr_users SET ?  where id = ?',[users,id], function (error, result, fields) 
						{
							if (error) 
							{
								console.log(error);
								res.send({
								  "status":3,
								  "failed":"Something went wrong!!!"
								});
							}else{
								numRows = result.affectedRows;
								if(numRows > 0)
								{
									res.send({
									  "message":"Password set sucessfully",
									  "status":1,
									});
									
								}else{
									res.send({
									  "status":2,
									  "message":"User does not exit in our record"
									});
								}
							}
						});	
					}
				}
			});
		});
	}else{
		res.send({
			  "status":2,
			  "message":"Password and confirm password not match."
			})
	}
});
app.post('/register', function(req, res){
	var today = new Date();
	var saltRounds = 10;
	var hospital=req.body.hospital;
	var email=req.body.email;
	if(hospital=='')
	{
		var status =3;
	}else{
		var status =2;
	}
	//bcrypt.hash(req.body.password, saltRounds, function (err,hash) {
	var users={
		"language":'en',
		"fname":req.body.fname,
		"lname":req.body.lname,
		"country":req.body.country,
		"city":req.body.city,
		"email":email,
		"mobile":req.body.mobile,
		"hospital":hospital,
		"device_type":req.body.device_type,
		"usertype":req.body.usertype,
		"status":status,
		"is_deleted":0,
		"created_date":today,
		"modified_date":today
	}
	connection.query("select * from mr_users where email = ?" ,[email], function (error, result, fields) 
	{
		if (error) 
		{
			res.send({
			  "status":3,
			  "message":"Something went wrong!!!"
			})
		}else
		{
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "status":4,
				  "message":"User already Exit"
				});	
			}else 
			{
				connection.query('INSERT INTO mr_users SET ?',users, function (error, result, fields) 
				{
					if (error) {
						res.send({
						  "status":3,
						  "message":"Something went wrong!!!"
						})
					}else{
						numRows = result.affectedRows;
						if(numRows > 0)
						{
							
							connection.query("select * from mr_users where email = ?" ,[email] ,function(error, results , fields){
								if(!!error){
									console.log('error in query ');
									res.send({
										  "code":400,
										  "message":"Error in Query"
										});
								} else {
									userid = results[0].id;
								}
							
								app.mailer.send('email', {
									to: email, // REQUIRED. This can be a comma delimited string just like a normal email to field. 
									subject: 'Set Your Password', // REQUIRED.
									otherProperty: "Link to forgot your password http://localhost:4200/reset/"+userid // All additional properties are also passed to the template as local variables.
								}, function (err) {
									if (err) {
									  // handle error
									  console.log(err);
									  res.send({
										  "message":"There was an error sending the email",
										  "status":2,
										});
										return;
									}
									res.send({
									  "message":"link send on email to set password",
									  "status":1,
									});
								});
							});
						}else{
							res.send({
							  "status":2,
							  "message":"User not added sucessfully"
							});
						}
					}
				});
			}
		}
	});
	//});
});
//********User Register************//
//********Edit Register ************//
app.post('/edituser', function(req, res){
	var today = new Date();
	var saltRounds = 10;
	//bcrypt.hash(req.body.password, saltRounds, function (err,   hash) {
		var users={
			//"language":req.body.language,
			"fname":req.body.fname,
			"lname":req.body.lname,
			"email":req.body.email,
			"country":req.body.country,
			"hospital":hospital,
			"mobile":mobile,
			"modified_date":today
		}
		var id = req.body.id;
		connection.query('update mr_users SET ? where id = ?',[users,id], function (error, result, fields) {
			if (error) {
				res.send({
				  "status":3,
				  "failed":"Something went wrong!!!"
				})
			}else{
				numRows = result.affectedRows;
				if(numRows > 0)
				{
					res.send({
					  "status":1,
					  "message":"User added sucessfully"
					});	
				}else{
					res.send({
					  "status":2,
					  "message":"User not added sucessfully"
					});
				}
			}
		});
	//});
});
//********Edit Register************//
app.post('/login', function(req, res){
	var ranstr = Math.random().toString(36).replace('0.', '') ;
	var email= req.body.email;
	var password = req.body.password;
	connection.query('SELECT * FROM mr_users WHERE email = ? and usertype=?',[email,'1'], function (error, results, fields)
	{
		if (error) 
		{
			res.send({
				"code":400,
				"failed":"error ocurred"
			})
		}else
		{
			if(results.length >0)
			{
				bcrypt.compare(password, results[0].password, function (err, result) 
				{
					connection.query('update mr_users set login_token =? WHERE email = ?',[ranstr,email], function (error, result, fields)
					{
						var sess = req.session;  //initialize session variable
						req.session.userId = results[0].id; //set user id
						req.session.email = results[0].email;//set user name
						ssn = req.session;
					});
					if(result == true){
						connection.query('SELECT * FROM mr_users WHERE email = ?',[email], function (error, resu, fields)
						{
							if (error) 
							{
								res.send({
									"code":400,
									"failed":"error ocurred"
								})
							}else
							{
								res.send({
									"status":'1',
									"message":"login sucessful",
									"data":resu
								});
							}
						});
					}
					else{
						res.send({
							"status":'0',
							"message":"Email or password does not match"
						});
					}
				});
			}
			else{
				res.send({
					"status":'0',
					"message":"Email does not exits"
				});
			}
		}
	});
});
app.post('/applogin', function(req, res){
	var ranstr = Math.random().toString(36).replace('0.', '') ;
	var email= req.body.email;
	var password = req.body.password;
	connection.query('SELECT * FROM mr_users WHERE email = ? and usertype !=?',[email,'1'], function (error, results, fields)
	{
		console.log(error);
		if (error) 
		{
			res.send({
				"code":400,
				"failed":"error ocurred"
			})
		}else
		{
			if(results.length >0)
			{
				bcrypt.compare(password, results[0].password, function (err, result) 
				{
					connection.query('update mr_users set login_token =? WHERE email = ?',[ranstr,email], function (error, result, fields)
					{
						var sess = req.session;  //initialize session variable
						req.session.userId = results[0].id; //set user id
						req.session.email = results[0].email;//set user name
						ssn = req.session;
					});
					if(result == true){
						connection.query('SELECT fname,lname,id,usertype,login_token FROM mr_users WHERE email = ?',[email], function (error, resu, fields)
						{
							if (error) 
							{
								res.send({
									"code":400,
									"failed":"error ocurred"
								})
							}else
							{
								res.send({
									"status":'1',
									"message":"login sucessful",
									"data":resu
								});
							}
						});
					}
					else{
						res.send({
							"status":'0',
							"message":"Email or password does not match"
						});
					}
				});
			}
			else{
				res.send({
					"status":'0',
					"message":"Email does not exits"
				});
			}
		}
	});
});
app.post('/slug', function(req, res){
	var today = new Date();
	var slug={
			"slug_name_ar":req.body.slug_name_ar,
			"slug_name_en":req.body.slug_name_en,
			"status":1,
			"is_deleted":0,
			"created_by":1,
			"modified_by":1,
			"created_date":today,
			"modified_date":today
		}
		connection.query('INSERT INTO mr_slug SET ?',slug, function (error, results, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			res.send({
			  "code":200,
			  "success":"Slug Added sucessfully"
			});
		}
	});
});
app.get('/sluglist' ,function(req, res){
	//var lang= req.body.language;
	/* if(lang=='en')
	{
		var sql ="select id,slug_name_ar from mr_slug";
	}else{
		var sql ="select id,slug_name_ar from mr_slug";
	} */
	var sql ="select * from mr_slug";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
            res.send({
				  "message":"Slug List",
				  "status":'1',
				  "data":result
				});
        }  
    });
});
app.get('/country' ,function(req, res){
	var sql ="select * from mr_country";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
            res.send({
				  "message":"Country List",
				  "status":'1',
				  "data":result
				});
        }  
    });
});
app.post('/slugid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from mr_slug where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"Slug Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"Slug Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.get('/slugdata' ,function(req, res){
	var sql ="SELECT sd.id,sd.title_en ,sd.title_ar,sd.description_en,sd.description_ar,s.slug_name_ar ,s.slug_name_en FROM mr_slug_data as sd JOIN mr_slug as s ON sd.slug_id = s.id";
	//var sql ="select * from mr_slug_data";
    connection.query(sql,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
        } else {
			if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
			res.send({
				  "message":"Slug Data List",
				  "status":'1',
				  "data":result
				});
        } 
        } 
    });
});
app.get('/hospital' ,function(req, res){
    connection.query("select * from mr_hospital",function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":'2',
				  "data":result
				});
        } else {
            res.send({
				  "message":"Hospital List",
				  "status":'1',
				  "data":result
				});
        } 
    });
});
app.post('/hospitalid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from mr_hospital where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"Hospital Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"Hospital Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.post('/slugdataid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from mr_slug_data where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"Slug Data Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"Slug Data Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.post('/createhospital', function(req, res){ 
	var hospital={
			"name_en":req.body.name_en,
			"name_ar":req.body.name_ar,
		}
		connection.query('INSERT INTO mr_hospital SET ?',hospital, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Hospital added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Hospital not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatehospital', function(req, res){ 
	var hospital={
			"name_en":req.body.name_en,
			"name_ar":req.body.name_ar,
		}
		var id = req.body.id;
		connection.query('Update mr_hospital  SET ? where id =?',[hospital,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Hospital updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Hospital not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/createslug', function(req, res){ 
	var slug={
			"slug_name_en":req.body.slug_name_en,
			"slug_name_ar":req.body.slug_name_ar,
		}
		connection.query('INSERT INTO mr_slug SET ?',slug, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updateslug', function(req, res){ 
	var slug={
			"slug_name_en":req.body.slug_name_en,
			"slug_name_ar":req.body.slug_name_ar,
		}
		var id = req.body.id;
		connection.query('Update mr_slug  SET ? where id =?',[slug,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/deleteslug', function(req, res){ 
		
		var id = req.body.id;
		connection.query("Update mr_slug  SET 	is_deleted='1' where id =?",[id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug deleted sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug not deleted sucessfully"
				});
			}
			
		}
	});
});
app.post('/createslugdata',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	var slug={
			"slug_id":req.body.slug_id,
			"title_en":req.body.title_en,
			"title_ar":req.body.title_ar,
			"description_en":req.body.description_en,
			"description_ar":req.body.description_ar,
			"image":req.file.filename,
			"img_path":req.file.path,
		}
		connection.query('INSERT INTO mr_slug_data SET ?',slug, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug data added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug data not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updateslugdata',upload.single('image'),function(req, res, next){ 
	//console.log(req.file);return;
	if(req.file ==undefined){
		var slug={
			"slug_id":req.body.slug_id,
			"title_en":req.body.title_en,
			"title_ar":req.body.title_ar,
			"description_en":req.body.description_en,
			"description_ar":req.body.description_ar,
		}
	}else{
		var slug={
			"slug_id":req.body.slug_id,
			"title_en":req.body.title_en,
			"title_ar":req.body.title_ar,
			"description_en":req.body.description_en,
			"description_ar":req.body.description_ar,
			"image":req.file.filename,
			"img_path":req.file.path,
		}
	}
	
		//console.log(slug);return;
		var id = req.body.id;
		connection.query('Update mr_slug_data  SET ? where id =?',[slug,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug data updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug data not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/deleteslugdata', function(req, res){ 
		
		var id = req.body.id;
		connection.query("Update mr_slug_data  SET 	is_deleted='1' where id =?",[id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Slug data deleted sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Slug data not deleted sucessfully"
				});
			}
			
		}
	});
});
app.post('/apislugdata', function(req, res){
	var login_token =req.body.auth;
	var lang =req.body.language;
	var slug_name = req.body.slug_name;
	connection.query('select id from mr_users where login_token= ?',login_token, function (error, results, fields) 
	{
		if (error) 
		{
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			numRows = results.length;
			if(numRows > 0)
			{
				if(lang=='en'){
					connection.query('select id from mr_slug where slug_name_en= ?',slug_name, function (error, results, fields) {
						if (error) {
							res.send({
							  "code":400,
							  "failed":"error ocurred"
							})
						}else{
							var slugid=results[0].id;
							connection.query('select id,title_en as title,description_en as description,img_path from mr_slug_data where 	slug_id= ?',slugid, function (error, results, fields) {
								if (error) {
									res.send({
									  "code":400,
									  "failed":"error ocurred"
									})
								}else{
									numRows = results.length;
									if(numRows > 0)
									{
										res.send({
										  "status":'1',
										  "message":"Slug data",
										  "data":results,
										});	
									}else{
										res.send({
										  "status":'2',
										  "message":"No slug Data found",
										  "data":'',
										});
									}
								}
							});
						}
					});
				}else{
					connection.query('select id from mr_slug where slug_name_en= ?',slug_name, function (error, results, fields) {
						if (error) {
							res.send({
							  "code":400,
							  "failed":"error ocurred"
							})
						}else{
							//console.log(results);return;
							var slugid=results[0].id;
							connection.query('select id,title_ar as title,description_ar as description ,img_path from mr_slug_data where 	slug_id= ?',slugid, function (error, results, fields) {
								if (error) {
									res.send({
									  "code":400,
									  "failed":"error ocurred"
									})
								}else{
									numRows = results.length;
									if(numRows > 0)
									{
										res.send({
										  "status":'1',
										  "message":"Slug data",
										  "data":results,
										});	
									}else{
										res.send({
										  "status":'2',
										  "message":"No slug Data found",
										  "data":'',
										});
									}
								}
							});
						}
					});
				}	
			}else{
				res.send({
				  "status":5,
				  "message":"Please Login!",
				  "data":'',
				});
			}
		}
	});
});
app.post('/appslugdataid' ,function(req, res){
	var id= req.body.id;
	var login_token =req.body.auth;
	var lang = req.body.language;
	connection.query('select id from mr_users where login_token= ?',login_token, function (error, results, fields) 
	{
		if (error) 
		{
			res.send({
			  "code":400,
			  "failed":"error ocurred"
			})
		}else{
			numRows = results.length;
			if(numRows > 0)
			{
				if(lang =='en'){
					connection.query("select title_en as title,description_en as description from mr_slug_data where id = ?" ,[id] ,function(error, result , fields){
						if(!!error){
							console.log('error in query ');
							res.send({
								  "code":400,
								  "message":"Error in Query"
								});
						} else {
							numRows = result.length;
							if(numRows > 0)
							{
								res.send({
								  "code":200,
								  "message":"Slug Detail",
								  "status":1,
								  "data":result
								});
							}else{
								res.send({
								  "code":200,
								  "message":"Slug Detail",
								  "status":2,
								  "data":result
								});
							}
							console.log(result);
						} 
					});
				}else{
					connection.query("select title_ar as title,description_ar as description from mr_slug_data where id = ?" ,[id] ,function(error, result , fields){
						if(!!error){
							console.log('error in query ');
							res.send({
								  "code":400,
								  "message":"Error in Query"
								});
						} else {
							numRows = result.length;
							if(numRows > 0)
							{
								res.send({
								  "code":200,
								  "message":"Slug Detail",
								  "status":1,
								  "data":result
								});
							}else{
								res.send({
								  "code":200,
								  "message":"Slug Detail",
								  "status":2,
								  "data":result
								});
							}
							console.log(result);
						} 
					});
				}
			}else{
				res.send({
				  "status":5,
				  "message":"Please Login!",
				  "data":'',
				});
			}
		}
	});
});
app.get('/userout',function(req,res){ 
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
		res.send({
		  "message":"User Logout",
		  "status":1,
		});
    }
  });
});
app.listen(8081);