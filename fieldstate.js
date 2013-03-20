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

    var returnNull = function() {
        return null;
    };
        
    if( !global.localStorage ) {
        global.localStorage = {
            getItem: returnNull,        
            setItem: returnNull,        
            removeItem: returnNull,
            clear: returnNull
        };
    }

    function FormFields( form ) {

        if( !form ) {
            this.element = document.createElement("form");
        }
        else if( "jquery" in form ) {
            this.element = form.filter("form")[0];
        }
        else if( "appendChild" in form ) {
            this.element = form;
        }
        
        form = this.element;
        this.identifier = (form.id + "");
    }


    FormFields.prototype = {
    
        restore: function() {
            var items = global.localStorage.getItem( this.identifier ),
                storedValue, storedValueType, $elems;
            
            if( !items ) {
                return;
            }
            
            items = JSON.parse( items );
            
            for( var key in items ) {
                storedValue = items[key];
                storedValueType = $.type( storedValue );
                
                if( storedValueType === "array" ) { //Multiple elements with same name
                
                    $elems = $( '[name="' + key + '"]', this.element );
                    
                    if( $elems.length === 1 ) { // A single element with multiple values
                        $elems.val( storedValue );
                    }
                    else {
                        $elems.each( $.proxy( function(index, elem){
                            var value = this[index];

                            if( typeof value === "boolean" ) {
                                elem.checked = value;
                            }
                            else {
                                $( elem ).val( value );
                            }
                        }, storedValue ) );
                    }
                }
                else if( storedValueType === "boolean" ) { //Radio/Checkbox. Cannot use .val
                    this.element[key].checked = storedValue;
                }
                else {
                    $( this.element[key] ).val( items[key] );                
                }
            }
            
        },
        
        clear: function() {
            global.localStorage.removeItem( this.identifier );
        },
        
        save: function() {
            if( !global.JSON || !global.JSON.stringify ) {
                return;
            }
            
            var obj = {};
            $( '[name][type!="hidden"][type!="file"][data-persist-fieldstate!="false"]', this.element ).each( function(){
                var name = this.name, value, type = this.type.toLowerCase();
                    
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
            
            global.localStorage.setItem( this.identifier, global.JSON.stringify( obj ) );
        },

        constructor: FormFields
    };
    
    $.fn.fields = function( option ) {
    
        return this.filter( "form" ).each( function() {
        
            var $this = $(this),
                instance = $this.data( "formfields-instance" );
            
            if( !instance ) {
                $this.data( "formfields-instance", ( instance = new FormFields( this ) ) );
                if( !option ) {
                    option = $this.data( "fieldstate" );
                }
            }
            
            if( typeof option === "string" && option in instance ) {
                instance[option]();
            }
        
        });
    
    };
    
    $.fn.fields.Constructor = FormFields;
    
    $( function() {
        $( "form[data-fieldstate]" ).fields().on( {
            submit: function() {
                $(this).fields("save");
            },
            
            reset: function() {
                $(this).fields("clear");
            },
            
            change: function() {
                $(this).fields("save");
            }
        });
        
        $( window ).on( "beforeunload", function(){
            $( "form[data-fieldstate]" ).fields("save");
        });
    });
    
})( this, this.jQuery );