{function sallow( left, right ) {
	return {
		"type": "AssignmentExpression",
		"operator": "=",
		left,
		right
	}
}
  function buildBinaryExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "BinaryExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }
  
  function sallowbinary( head, tail ) {
	return {
        "type": "AssignmentExpression",
		"operator": "=",
        left:head,
         "right": bin(head, tail)
    }
  }
  function bin( head, tail ) {
	return {
        "type": "BinaryExpression",
		"operator": tail[0],
        left:head,
        right:tail[1]
    }
  }
  function buildPipelineExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type: "PipelineExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    }, head);
  }
  function buildReferenceExpression(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        type:"ReferenceExpression",
        operator: element[1],
        left: result,
        right: element[3]
      };
    },head);
  }
  function param(head, tail) {
    return tail.reduce(function(result, element) {
      return {
        result,
        right:element[1]
      };
    },head);
  }
  function filterCommas(arr) {
    return arr.filter(item => item !== ",");
  }
}


program
	= body: comp{
		return{
			"type":  "Program",
			body
		}
	}

comp = compstmt*

compstmt
	= includestmt
    /definestmt
    /functionstmt
    
    
includestmt = _ "#include" _ "<" word:$(word SourceCharacter word) ">" _{
       return {
       			"type":"Include",
                "standardheader":word
       }
     }
     
definestmt =  _ "#define" _ word:$word _ "(" iden:iden ")" _ stmt:stmt _{
       return {
                "type":"define",
                "funcname":word,
                "argument":iden,
                stmt
              }
       }
       / _ "#define" _ iden:iden _ Parameter:Parameter _{
       return {
                "type":"define",
                "name":iden,
                Parameter,
              }
       }
       

functionstmt = multistmt

multistmt = stmt

stmt = returnstmt
    /expr
    /ifstmt
    /whilestmt
    /dostmt
    /forstmt
    /function
    /vardeclarestmt
    /calcstmt
   

variable = 
          _ model:Model _  expr:expr _{ return {//int a=10
							"type" : "variable",
							"model" : model,
                            "value":expr.left,
                            expr
                            }
                       }
              /_ model:Model _ iden:multivariable";" _{ return {//int a
							"type" : "variable",
							"model" : model,
                            "value" : iden
                            }
                       }
              / _ model:Model _ iden:iden ";"_{ return {//int a,b,c
							"type" : "variable",
							"model" : model,
                            "value" : iden
                            }
                       }
                       
multivariable= head:iden tail:("," iden)+ {return[head].concat(tail.map(item => item[1]));
                }
           
structmodifier = _ model:$iden _ left:expr{
						return {
                        		 "type":"variable",
                                 "model":model,
                                 left
                               }
                        }
                
                /_ model:$iden _ name:iden ";"_{
						return {
                        		 "type":"variable",
                                 "model":model,
                                 name
                               }
                        }
                
                /_ model:iden _ "*"+iden:(iden ( _ "," _ "*"+iden)*) ";"_{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : iden
                            }
                       }
                /_ model:iden["*"]+ _ iden:iden ";"_{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : iden
                            }
                       }

                / _ struct:"struct" _ iden:$iden _ block:block _ {
                        return { 
                                 "type":"structure",
                                 "model": struct + " " +iden,
                                 block
                               }
                        }
                / _ "typedef" _ "struct" _ (iden:iden)? _ block:block _ tagiden:iden ";"_ {
                        return { 
                                 "type":"structure",
                                 "model":tagiden,
                                 block
                               }
                        }

arraymodifier = _ model:Model _ left:to arraydeep:arraydeep _"="_  "{" right:ParameterList "}" ";"_{
    return{
      "type": "array",
      "model":model,
      "value":left,
      arraydeep,
      right
    }
  }
  /_ model:Model _ left:to "[" int:(from)? "]" _"="_ "{" right:ParameterList "}"";" _{
    return{
      "type": "array",
      "model":model,
      "length": int,
      left,
      right
    }
  }
  /_ model:Model _ left:to arraydeep:arraydeep ";"_{
    return{
      "type": "array",
      "model":model,
      "name":left,
      arraydeep,
    }
  }

  /_ model:Model _ iden:iden "[" int:from? "]" ";"_{
    return{
      "type": "array",
      "model":model,
      "value":iden,
      "length": int
    }
  }
  
pointmodifier = _ model:Model"*" _ expr:expr _{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : expr.left,
                            expr
                            }
                       }
                /_ model:Model"*" _ iden:iden "[" int:from? "]" ";"_{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : iden,
                            "length" : int
                            }
                       }
                /_ model:Model"*" _ iden:iden ";"_{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : iden
                            }
                       }
                       
staticvariable = _ "static" _ model:Model _ iden:iden ";"_ { return{
                            "type" : "staticvariable",
                            "model" : model,
                            "value" : iden
                            }
                        }

Model = "void"
	/"int"
	/"float"
    /"double"
    /"char"
    /$("struct" _ iden)

vardeclarestmt = structmodifier
    /arraymodifier
    /pointmodifier
    /staticvariable
    /variable


function = _ model:Model _ name:$word "("_ parameterlist:ParameterList? _")" block:block _{
              return {
              			"type":"FunctionDefinition",
                        "return value":model,
                        "name":name,
                        "parameter":parameterlist,
                        block
                     }
              }
          / _ !ReservedWord model:(Model)? _ name:$word "(" parameterlist:ParameterList? ")" ";"_{
              return {
              			"type":"FunctionExecution",
                        "name":name,
                        "parameter":parameterlist
                     }
              }
          / _ model:Model _ name:$word "(" parameterlist:ParameterList? ")"";" _{
              return {
              			"type":"FunctionDefinition",
                        "name":name,
                        "parameter":parameterlist
                     }
              }
              
start
  = elements:ParameterList { return filterCommas(elements); }
              
ParameterList = head:Parameter tail:("," Parameter)* {
                return [head].concat(tail.map(item => item[1]));
                }
               
Parameter = Parametervardeclarestmt
           /from
           /"&"from
           /"void"{
               return {
                         "Parameter":"void"
               }
           }
           
Parametervardeclarestmt =  _ model:Model"*" _ iden:iden _{ return {
							"type" : "pointer",
							"model" : model,
                            "value" : iden
                            }
                       }
                /_ model:Model _ left:to "[" row:from? "]""[" column:from? "]" _{
   						return{
     						"type": "array",
      						"model":model,
      						"row": row,
      						"column":column,
      						"name":left
    					}
  				   }

  				/_ model:Model _ iden:iden "[" int:from? "]" {
    					return{
      						"type": "array",
      						"model":model,
      						"value":iden,
      						"length": int
    					}
  				   }
                / _ model:Model _ iden:iden _{ return {//int a,b,c
							"type" : "variable",
							"model" : model,
                            "value" : iden
                            }
                       }

multideclare = head:Parameter tail:("," Parameter)* {
                return [head].concat(tail.map(item => item[1]));
                }
           
ifstmt
	 	= _ name:"if" "(" condition:condition ")" block:block _ {
        	return {
            	"type": name + "Statement",
                "funcname":name,
                condition,
                block
            }
          }
          /_ name:"else if" "(" condition:condition ")" block:block _ {
        	return {
            	"type": name + "Statement",
                "funcname":name,
                condition,
                block
            }
          }
          /_ name:"else" block:block _ {
        	return {
            	"type": name + "Statement",
                "funcname":name,
                block
            }
          }

whilestmt
	 	= _ name:"while" "(" condition:condition ")" block:block _ {
        	return {
            	"type": name + "Statement",
                "funcname":name,
                condition,
                block
            }
          }

dostmt = _ name:"do" block:block "while" "(" condition:condition ")" ";"_{
                      return{
                             "type":name + "Statement",
                             block,
                             condition
                             }
                      }

forstmt = _ name:"for" "(" _ AssignmentExpression:stmt? _ condition:(condition)? ";" _ ChangeExpression:(ChangeExpression)* _ ")" block:block _{
        	return {
            	"type": "ForStatement",
                "funcname":name,
                AssignmentExpression,
                condition,
                ChangeExpression,
                block
            }
          }

expr
	= _ left:to _"="_ right:function _{
		return sallow( left, right );
	}
    /_ left:to _"="_ right:(from)";" _{
		return sallow( left, right );
	}
    /_ left:( "("from")") _"="_ right:(from)";" _{
		return sallow( left, right );
	}
    /_ left:(anyarray) _"="_ right:from ";"_{
		return sallow( left, right );
	}
    /_ left:Expression _"="_ right:Expression ";"_{
		return sallow( left, right );
	}
    /AssignmentExpression

          
block = _ "{" _ stmt:(multistmt)* _ "}" _{ 
			return {
            			"type": "block",
						stmt
            }
           }

calcstmt
	= _ expression:ChangeExpression2 _{
        return {
            "type":"ExpressionStatement",
            expression
          }
        }
  /_ expression:from _{
		return {
			"type": "ExpressionStatement",
            expression                                                                                                
		}
      }

returnstmt = _ "return" _ value:from ";"{
                return{
                        "type":"returnStatement",
                        "value":value
                      }
                }


condition = from



Expression
  = head:Term tail:(_ [+-] _ Term)* {
      return buildBinaryExpression(head, tail)
    }
    

Term
  = head:allow tail:(_ [*/%] _ allow)* {
      return buildBinaryExpression(head, tail)
    }

allow
  = head:Factor tail:(_ ReferenceOperator _ Factor)* {
      return buildReferenceExpression(head, tail)
    }

Factor
  = "{" _ compstmt:ParameterList _ "}" { return compstmt; }
  /"(" _ expr:Expression _ ")" { return expr; }
  /anyarray
  /NumericLiteral
  /StringLiteral
  /iden
  
  
Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }
  
to 
 =name:iden{
       return name
       }
       
iden
       = !ReservedWord word:$(word){
       return{"type":"Identifier", name:word}
       }
       / "'" word:$(word) "'"{
        return{"type":"Character", word}
       }
       /"*"word:$(word){
       return {"type":"Pointer", name:word}
       }
       /"*" "(" expr:Expression ")"{
       return {"type":"Pointer", expr:expr}
       }
       /"&"word:$(word){
       return {"type":"address", name:word}
       }
       
word
     = word:[a-zA-Z][0-9a-zA-Z_]*
     
ReservedWord = Model
              /"typedef"
              /"if"
              /"else"
              /"do"
              /"while"
              /"for"
              /"main"

_ "whitespace"
  = [ \t\n\r]*
  


from
  = ChangeExpression
  /syuutan
  /RelationExpression
  / value:NumericLiteral{
    return{
			"type": "Literal",
			"value": value
		}
	}
    / name:iden{
    	return name
    }
    
RelationExpression
  = _ head:Expression tail:(_ RelationalOperator _ Expression)* _　{
      　　return buildBinaryExpression( head, tail);
     }

ChangeExpression
  = _ iden:iden "++" _ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"++",
                           "left":iden,
                           "right":1
                           }
                    }
    /iden:iden "--"_ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"--",
                           "left":iden,
                           "right":-1
                           }
                    }
    / "++" iden:iden _ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"++",
                           "left":iden,
                           "right":1
                           }
                    }
    /"--" iden:iden _ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"--",
                           "left":iden,
                           "right":-1
                           }
                    }
                    
ChangeExpression2
  = _ iden:iden "++" ";"_ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"++",
                           "left":iden,
                           "right":1
                           }
                    }
    /iden:iden "--"";"_ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"--",
                           "left":iden,
                           "right":-1
                           }
                    }
    / "++" iden:iden ";"_ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"++",
                           "left":iden,
                           "right":1
                           }
                    }
    /"--" iden:iden ";"_ {
                    return {
                           "type":"ChangeExpression",
                           "Operator":"--",
                           "left":iden,
                           "right":-1
                           }
                    }

syuutan = "'" "¥0" "'"

arrayelement =  length:from{
    			return{
      				"type": "array",
      				"location": length
   				 }
  			}
            
decarrayelement =  length:from{
    			return{
      				"type": "array",
      				"length": length
   				 }
  			}
  
anyarray = head:iden tail:("["arrayelement"]")+ {
                return [head].concat(tail.map(item => item[1]));
           }

arraydeep =  tail:("[" decarrayelement "]" )+ {
                return (tail.map(item => item[1]));
           }



NumericLiteral
 = suffix:$(suffix) {
    return { "type": "Literal", value: suffix, class: "Number" }
  }
  /float:$(float) {
    return {"type":"Literal", value: parseFloat(float) , class: "Number"}
  }
  /hexint:$(hexint) {
    return { "type": "Literal", value: hexint, class: "Number" }
  }
  /int:$(int) {
    return { "type": "Literal", value: parseInt(int), class: "Number" }
  }
  

StringLiteral
  = '"' chars:DoubleQuoteCharacter* '"' {
    return { type: "Literal", value: chars.join(""), class: "String" };
  }

DoubleQuoteCharacter
  = !'"' SourceCharacter { return text(); }
  
SourceCharacter = .


RelationalOperator
  = "<="
  / ">="
  / "<"
  / ">"
  / "="
  / "^"
  / "&"
  / "|"
  / "~"

AssignmentExpression = 
				_ left:iden right:( ExprOperator  from) _{
                			return sallowbinary(left, right);
                            }

ExprOperator
  =  "+=" {
            return{
            	"type":"BinaryExpression",
                "operator":"+",
            }
         }
  / "-=" {
            return{
            	"type":"BinaryExpression",
                "operator":"-",
            }
         }
  / "*=" {
            return{
            	"type":"BinaryExpression",
                "operator":"*",
            }
         }
  / "/=" {
            return{
            	"type":"BinaryExpression",
                "operator":"/",
            }
         }
  / "%=" {
           return{
                "type":"BinaryExpression",
                "operator":"%",
            }
         }

ConvertOperator
  = "%d"
  / "%s"
  / "%f"
  / "%lf"
  / "%c"
  / "%u"
  / "%ld"
  / "%lu"
  / "\\n"
  
ReferenceOperator 
  = "->"
  / "."

float = int frac digits

suffix = int frac digits word

hexint
  = signe? "0x" hexdigits

int 
 =digit19 digits
 /digit

digit19 = [1-9]
digit= [0-9]
digits=digit+
hexdigits = [0-9a-f]+

signe
  = "+"
  / "-"

frac = "."