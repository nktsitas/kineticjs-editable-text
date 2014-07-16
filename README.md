# kinetic-editable-text
##### A KineticJS library which enables text creation and editing directly on the canvas

## Summary

Re-inventing the wheel in text editing!

This tool was created in order to avoid the HTML textarea popup when wanting to enter text on the canvas. Most operations are supported, such as cursor movement, backspace, delete, and entering new lines.

Selecting text is not yet supported.

## Initialization

#### Without a module loader
The global ```Kinetic``` object will be extended with ```Kinetic.EditableText```

#### With CommonJS or AMD
kinetic-editable-text will return an object containing an ```init``` method. ```Kinetic``` is passed as the first argument to the ```init``` method, and will be extended with ```Kinetic.EditableText```. An AMD example:

    define([ 'Kinetic', 'kineticEditableText' ], function( Kinetic, kineticEditableText ){
        console.log( typeof Kinetic.EditableText ); // undefined
    
        kineticEditableText.init( Kinetic );
    
        console.log( typeof Kinetic.EditableText ); // function
    });

## API

#### Kinetic.EditableText.focus()

Focus the ```Kinetic.EditableText``` field so that it will start receiving text input.

#### Kinetic.EditableText.unfocus()

Unfocus the ```Kinetic.EditableText``` field so that it will stop receiving text input.

#### Kinetic.EditableText.addChar( ```character``` )

Add the specified ```character``` (string) to the ```Kinetic.EditableText``` field at the current cursor position. 

#### Kinetic.EditableText.text( ```string``` )

This method mimics ```Kinetic.Text.text```. If ```string``` is provided, the text in the ```Kinetic.EditableText``` field will be set to ```string```; otherwise, the text currently in the field will be returned.

#### Kinetic.EditableText.backspaceChar()

Remove the character to the left of the current cursor position.

#### Kinetic.EditableText.deleteChar()

Remove the character to the right of the current cursor position.

#### Kinetic.EditableText.clear()

Remove all of the characters from the ```Kinetic.EditableText``` field.


## Example

See [index.html](https://github.com/nktsitas/kineticjs-editable-text/blob/master/index.html)


## About

* Licenced under [GNU General Public License, Version 3.0]
* Used in [Learnitopia] for text input in Virtual Classrooms.


## Known Issues

* Selecting text is not supported.
* Copy paste (from outside text) is not fully functional yet.


## Limitations

Tested with Kinetic v5.1.0 and v5.1.1


## Contributions

Feel free to make a pull request and contribute to making this tool better.

[Learnitopia]: https://learnitopia.com
[GNU General Public License, Version 3.0]: http://www.gnu.org/licenses/gpl-3.0-standalone.html