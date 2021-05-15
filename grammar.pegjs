Expression = (DeclareGen / WireUp)* _

symbol "symbol"
  = [a-zA-Z_][a-zA-Z0-9_]* { return text(); }
  
value "value"
  = [^,)]+ { return text() }
  
param "param"
 = _ key:symbol "=" val:value ","? { return [key, val] }
 
DeclareParams "param-expr"
  = "(" params:param* ")" {
  	let res = {};
    params.forEach((p) => { res[p[0]] = p[1]; })
    return res;
 }
  
DeclareGen "gen-decl"
  = _ type:symbol _ name:symbol _ params:DeclareParams? _ ";" {
  	return {"action": "gen-decl", "type": type, "name": name, "params": params}
  }
  
Port "port-expr"
  = _ gen:symbol "." port:symbol { return { generator: gen, port: port } }
  
WireUp "wire-expr"
  = _ from:Port _ "->" _ to:Port _ ";" {
  	return {"action": "wire-expr", "from": from, "to": to}
  }

_ "whitespace"
  = [ \t\n\r]*