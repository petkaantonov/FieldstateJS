/*
Copyright (c) 2012 Petka Antonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:</p>

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function( global, $ ) {

    function escapeForQuote( str ) {
        return (str + "").replace( /(\\|")/g, "\\$1" );
    }
    
    var invalidTypes = {
        "button": 0,
        "file": 0,
        "hidden": 0,
        "image": 0,
        "reset": 0,
        "submit": 0
    };

    var returnNull = function() {
        return null;
    };
        
    if( !global.sessionStorage ) {
        global.sessionStorage = {
            getItem: returnNull,        
            setItem: returnNull,        
            removeItem: returnNull,
            clear: returnNull
        };
    }

    function FieldState( form ) {
        this.element = $(form);
        this.identifier = (this.element.prop("id") + "");
    }


    FieldState.prototype = {
    
        restore: function() {
            var items = global.sessionStorage.getItem( this.identifier ),
                storedValue, storedValueType, $elems;
            
            if( !items ) {
                return;
            }
            
            try {
                items = $.parseJSON( items );
            }
            catch( error ) {
                return;
            }
            
            for( var key in items ) {
                storedValue = items[key];
                storedValueType = $.type( storedValue );

                $elems = $( '[name="' + escapeForQuote(key)  + '"]', this.element );
                
                if( storedValueType === "array" ) { //Multiple elements with same name or single element with multiple values
                
                    if( $elems.length === 1 ) { // A single element with multiple values
                        $elems.val( storedValue );
                    }
                    else {
                        $elems.each( $.proxy( function(index, elem){
                            var value = this[index];

                            if( typeof value === "boolean" ) {  //Radio/Checkbox
                                elem.checked = value;
                            }
                            else {
                                $( elem ).val( value )
                            }
                        }, storedValue ) );
                    } 
                }
                else if( storedValueType === "boolean" ) { //Radio/Checkbox
                    $elems.prop("checked", storedValue);
                }
                else {
                    $elems.val( items[key] );                
                }
                $elems.trigger("fieldstate:restored");
            }
            
        },
        
        clear: function() {
            global.sessionStorage.removeItem( this.identifier );
        },
        
        save: function() {
            if( !global.JSON || !global.JSON.stringify ) {
                return;
            }
            
            var obj = {};
            $( '[name][data-fieldstate!="false"]', this.element ).each( function(){
                var name = this.name, value, type = this.type && this.type.toLowerCase() || "";
                
                if( invalidTypes[type] === 0 ) {
                    return;
                }
                
                if( name && $(this).is("input,select,textarea") ) {
                    
                    value = type === "radio" || type === "checkbox" ? !!this.checked : $(this).val();

                    if( name in obj ) { //Multiple elements with same name
                        if( $.type( obj[name] ) !== "array" ) {
                            obj[name] = [obj[name]];
                        }
                        obj[name].push( value );
                    }
                    else {
                        obj[name] = value;
                    }
                }
            });
            
            global.sessionStorage.setItem( this.identifier, global.JSON.stringify( obj ) );
        },

        constructor: FieldState
    };
    
    $.fn.fieldstate = function( option ) {
    
        return this.filter( "form" ).each( function() {
        
            var $this = $(this),
                instance = $this.data( "FieldState-instance" );
            
            if( !instance ) {
                $this.data( "FieldState-instance", ( instance = new FieldState( this ) ) );
                if( !option ) {
                    option = $this.data( "fieldstate" );
                }
            }
            
            if( typeof option === "string" && option in instance ) {
                instance[option]();
            }
        
        });
    
    };
    
    $.fn.fieldstate.Constructor = FieldState;
    $( function() {
        $( "form[data-fieldstate]" ).fieldstate().on( {
            submit: function() {
                $(this).fieldstate("save");
            },
            
            reset: function() {
                $(this).fieldstate("clear");
            },
            
            change: function() {
                $(this).fieldstate("save");
            }
        });
        
        $( window ).on( "beforeunload", function(){
            $( "form[data-fieldstate]" ).fieldstate("save");
        });
    });
    
})( this, this.jQuery );