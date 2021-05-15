# VSynth
Inspired by the [ChucK](https://chuck.cs.princeton.edu/) programming language, this tool allows you to use a similar (but much, *much* more limited) version of that language to create visual output.

This is a quick/dirty hack language, so don't expect great feedback or ergonomics. It's a toy that I enjoy playing with, and I hope you do too.

## Using the tool
You can access a demo from [here](https://remyporter.github.io/VSynth/).

The UI has a canvas area where the output draws, a text area where you can enter code, a run button which will execute your code, and a small console area which will output any errors in your code.

## Syntax
The VSynth language consists of two kinds of statements: generator declarations, and wireups.

### Generator Declarations
To spawn a generator, you use the following statement:

```
GeneratorType label;
```

Or, concretely:

```
Trig t;
```

This creates a generator of the specified type, which can be referred to by label. While many times, you'll be wiring together generators via ports, you may wish to control ports directly when creating the generator.

```
GeneratorType label(portName=defaultValue, otherPortName=defaultValue);
```

Or, concretely:

```
Trig t(frequency=0.125);
```

NB: this language doesn't have datatypes, so whatever you pass into the initalizer will be passed *exactly as specified*, and it's up to the generator to parse the value. This is important on the `Beats` generator.

### Generator Wireups
Once generators have been declared, they can be wired together via their labels. A wireup statement looks like:

```
genLabel.portName->otherGenLabel.otherPortName;
```

Or, for a "hello world" program, which draws a circle:

```
Trig t(frequency=0.2);
Line l;
t.sin->l.x;
t.cos->l.y;
```

This connects the `sin` output of the `Trig`onometry generator to the `x` port on the `Line` generator, and `cos` to the `y`.

## Generators
There are a number of generators you can use in a drawing. Each generator may have Input ports, and Output ports. When wiring, you should wire Outputs to Inputs (though there's nothing in the language which enforces this, but you probably will get meaningless results).

Any port can be given an initial value using the generator declaration syntax above.

**NB**: all screen coordinates (any x/y/w/h ports) are mapped so that the screen area ranges from -1..1.

### Value
The `Value` generator outputs just a steady value, useful as a constant. This generator has only one port, but that port is both an input *and* an output.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `value`: the value to be output (default: null)
</td>
<td>

* `value`: the value to be output
</td>
</tr>
</table>

### Tick
The `Tick` generator outputs an incrementing series of values within a range. When it hits the end of the range, it loops back to the beginning.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `min`: floating point value which is the minimum end of the range. (default: -1)
* `max`: floating point value which is the maximum edge of the range (default: 1)
* `incr`: the step per frame (default: 0.01)
</td>
<td>

* `tick`: the current value of the tick sequence
</td>
</tr>
</table>

### Trig
The `Trig`onometry generator outputs the result of trig functions with a specified frequency.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `frequency`: the frequency, in HZ, by which this signal should vary. (default: 10)
</td>
<td>

* `sin`: a sine wave with that frequency
* `cos`: a cosine wave with that frequency
* `tan`: a tangent wave with that frequency
</td>
</tr>
</table>

### Math
The `Math` generator can perform basic arithmetic on its inputs.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `a`: operand a (default: null)
* `b`: operand b (default: null)
</td>
<td>

* `aPlusB`: `a + b`
* `aTimesB`: `a * b`
* `aMinusB`: `a - b`
* `aOverB`: `a / b`
* `aModB`: `a % b`
</td>
</tr>
</table>

### Gate
The `Gate` gen allows a value to pass through when a key is pressed. NB, because there are no types, you shouldn't wrap the `key` expression in quotes.

`Gate g(key=page down)` is correct, `Gate g(key="page down")` is wrong.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `key`: The name for a keycode (see [keycodes](keycodes.js) for the lookup table). When this key is held down, the `out`put will be the value of `in`. (default: q)
* `in`: The input signal (default: 1.0)
* `latches`: If false, when the key is released, the `out` value will be zero. If true, when the key is released, the value will hold the *last* value received from the `input` while the key was held. (default: false)
</td>
<td>

* `out`: The value of `in` while the key is held down.
</td>
</tr>
</table>

### Beat
The `Beat` generator is a version of a gate which outputs its `in` value, not based on keystrokes, but based on a beat pattern.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `pattern`: a string. Each character in the string represents one beat. If that character is an `x`, `^`, or `*`, we `out`put our `in`put value for that beat. Any other character we `out`put 0. This `pattern` loops indefinitely.
* `in`: our input value. (default: 1.0)
* `bpm`: the beats-per-minute
</td>
<td>

* `out`: If the current beat in our pattern is `x`, `^`, or `*`, we output `in`. Otherwise, we output 0.
</td>
</tr>
</table>

### Pixel
The `Pixel` generator colors in pixels each frame, based on its inputs.

NB: the `r/g/b` values accept valuse in the range from -1..1, but take the absolute value- so `-1,-1,-1` would be white, as would `1,1,1`

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `x`: the x coordinate default: 0)
* `y`: the y coordinate (default: 0)
* `r`: the red value default: 1)
* `g`: the green value default: 1)
* `b`: the blue value default: 1)
</td>
<td>

*No ports* - draws pixels on the screen
</td>
</tr>
</table>

### Line
The `Line` generator works as the pixel generator, but "connects" the dots, by drawing a line from each pixel to the next.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `x`: the x coordinate (default: 0)
* `y`: the y coordinate (default: 0)
* `r`: the red value (default: 1)
* `g`: the green value (default: 1)
* `b`: the blue value (default: 1)
</td>
<td>

*No ports* - draws lines on the screen
</td>
</tr>
</table>

### Rotate
The `Rotate` generator rotates the coordinate system about the origin (the center of the screen).

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `r`: the angle, in radians (default: 0)
</td>
<td>

*No ports* - rotates the screen
</td>
</tr>
</table>

### Clear
The `Clear` generator clears some or all of the screen, by drawing a black rectangle over that area of the screen.

<table>
<tr>
<th>
Inputs
</th>
<th>
Outputs
</th>
</tr>
<tr>
<td>

* `x`: the x coordinate of the box (default: -3)
* `y`: the y coordinate of the box (default: -3)
* `w`: the width of the box (default: 4)
* `h`: the height of the box (default: 4)
* `trig`: When this value is greater than zero, this clears the screen. 
</td>
<td>

*No ports* - draws pixels on the screen
</td>
</tr>
</table>

### Log
The `Log` generator will accept inputs and dump them to the browser console. It can be useful for debugging.

The input ports are all named `value0`-`value9`. This has no output ports.