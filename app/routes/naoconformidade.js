function fromHex(hex){
	var str;
	try{
		str = decodeURIComponent(hex.replace(/(..)/g,'%$1'));
	}catch(e){
		str = hex;
		console.log('invalid hex input: ' + hex);
	}
	return str;
}

function toHex(str){
	var hex;
	try{
		hex = unescape(encodeURIComponent(str)).split('').map(function(v){
			return v.charCodeAt(0).toString(16);
		}).join('');
	}catch(e){
		hex = str;
		console.log('invalid text input: ' + str);
	}
	
	return hex;
}

module.exports = function(app){
	
	app.get('/naoconformidade', function(req, res, next){
		
		var connection = app.infra.connectionFactory;
		
		var addressParam = req.query.address;

		var qtdRegistros = req.query.qtdRegistros;

		connection.listAddressTransactions(
				{"address": addressParam, "count": parseInt(qtdRegistros)},
				(err, result) => {
			
			if(err){
				return next(JSON.stringify(err));
        	}
			
			res.render('naoconformidade/listagem.ejs', {lista: result});
        	
		});	
		
	});	
	
	app.get('/naoconformidade/input', function(req, res, next){
		var connection = app.infra.connectionFactory;
		
		connection.getAddresses({"verbose": true},(err, result) => {
        	if(err){
        		return next(err);
        	}

        	res.render('naoconformidade/input.ejs', {errosValidacao: {}, naoconformidade: {}, address: result});
    	});  
		
	});
	
	app.post('/naoconformidade', function(req, res, next){
		
		var naoconformidade = req.body;

		//Validações possíveis graças ao express-validator :)
		req.assert('data', 'Data é obrigatória').notEmpty();
		req.assert('address', 'Address é obrigatório').notEmpty();
		
		var erros = req.validationErrors();
		
		if(erros){
			res.format({
				html: function(){					 
					res.status(400).render('naoconformidade/input', 
							{errosValidacao: erros, naoconformidade: naoconformidade});
				},
				json: function(){
					res.status(400).json(erros);
				}
			});

			return;
		}
		
		var connection = app.infra.connectionFactory;
		
		console.log("sendWithMetadata-JSON: "+JSON.stringify(naoconformidade));
		var valorHex = toHex(JSON.stringify(naoconformidade));
		console.log("sendWithMetadata-HEX: "+valorHex);		
		
		connection.sendWithMetadata(
				{"address": naoconformidade.address, "amount": 0, "data": valorHex},
				(err, result) => {
			
			console.log("Err: "+err);
			
			console.log("Result: "+result);
			
			if(err){
				return next(err);
        	}
   	 
			res.redirect('/naoconformidade?address=' + naoconformidade.address+'&qtdRegistros='+100);
        	
		});				
		
	});
}
