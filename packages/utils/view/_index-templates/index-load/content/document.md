<style>
/*
h1, h2, h3, h4, h5, h6 { color: #0050a0; }
a { color: #0044ff; text-decoration: underline; }
pre, code { background-color: #555555; color: #ffffff; }
code { padding-inline: 0.3rem; }
pre > code { background-color: rgba(128, 128, 128, 0); padding-inline: 0; }
.no-display { display: none; }
.main-doc { background-color: #aaaaaa; color: #003355; padding: 2rem; }
.fit-content > * { width: inherit; height: inherit; object-fit: scale-down; }

table, th, td { border: 1px solid #777777; border-collapse: collapse; }
th, td { padding: 0.5rem; text-align: left; }
th { background-color: rgba(128, 128, 128, 0.5); }

input[type="checkbox"] {
  appearance: none; position: relative; width: 1rem; height: 1rem; vertical-align: middle;
  background-color: #999999; border: 1px solid #777777; border-radius: 0.125rem;
}
input[type="checkbox"]:checked::after {
  content: ''; position: absolute; width: 0.25rem; height: 0.5rem; left: 0.2rem; top: 0;
  border: 0.2rem solid #ffffff; border-top: none; border-left: none; transform: rotate(45deg);
}

.hi { color: #000088; }
.bye { color: #880000; }
*/
</style>
<link rel="stylesheet" href="./content.css"/>
<script src="./content.js"></script>
<script>console.log(`inline js!`); document.querySelector('.notes').append(`\ninline js!`);</script>
<div class="main-doc">

# Neural Network Insights

A quick overview of how a neural network works.

A neural network is an input-output system that attempts to predict unknown results based on the pattern of known samples.

## A simple problem

We have a number of **_boxes_** of __*different*__ sizes and we want to know if they fit in a given container.

We'll simplify the problem to a plane, so figures only have width and height.

Boxes can be as small as 10cm or as big as 100cm side.

The container is 80cm x 40cm, but this is unknown, we'll just check if the boxes we have fit inside the container or not, in one position or another.

Some boxes will be classified as valid (value 1) and others as invalid (value 0).

We can write a table with the measures of the boxes we have and their fitting result.

In metres, so the values are directly suitable for a network input (between 0 and 1), otherwise a mapping function would be required.

We can also draw a diagram of widths and heights with the distribution of the valid and invalid samples.

The goal of our neural network is to predict if new given boxes will be valid or not, so in the distribution diagram they will fall in the area of valid boxes, or in the area of invalid boxes.

In this case, the border that separates both areas seems to be more or less a straight line, so the neural network that makes the predictions should not need to be too large.

## The neural network

The neural network (a.k.a. perceptron) is an input-output system that uses nodes (neurons) and bonds (weights) to calculate a result.

The network is run from the input to the output, computing the sum of products of values and weights, plus an optional bias, which acts as a weight adjustment.

The sum is processed by an `activation` function, which transforms any given value into a fraction between 0 and 1.

```javascript
  activation(i1 * w1 + i2 * w2 + bias)
  activation(i1 * w1 + i2 * w2 + bias)
  activation(i1 * w1 + i2 * w2 + bias)

- Item A
- Item B
    1. Item B 1
    1. Item B 2
        - Item B 2 A
        - Item B 2 B `some code` <span class="fit-content" style="height: 1.2rem; vertical-align: sub;">![Alt](./assets/img-land.jpg "Title")</span> more text
        - Item B 2 C
    1. Item B 3
- Item C

| Syntax `header` | Description `header` |
| ---             | -----------          |
| Header `row`    | Title `cell`         |
| Paragraph `row` | Text `cell`          |

- [ ] (first checkbox)
- [x] (second checkbox)
- [ ] (third checkbox)
- [x] (fourth checkbox)
```

The most universal activation function for neural networks is called the `sigmoid`, defined as `1 / (1 + Math.exp(-x))`, (`exp` is constant `E` raised to exponent), and it tends to `0` on `-Infinity`, and to `1` on `+Infinity`, transitioning smoothly from one value to the other around `x = 0`.

- Item A
- Item B
    1. Item B 1
    1. Item B 2
        - Item B 2 A
        - Item B 2 B `some code` <span class="fit-content" style="height: 1.2rem; vertical-align: sub;">![Alt](./assets/img-land.jpg "Title")</span> more text
        - Item B 2 C
    1. Item B 3
- Item C

| Syntax `header` | Description `header` |
| --- | ----------- |
| Header `row` | Title `cell` |
| Paragraph `row` | Text `cell` |

- [ ] (first checkbox)
- [x] (second checkbox)
- [ ] (third checkbox)
- [x] (fourth checkbox)

## Training the neural network

<span class="fit-content" style="width: 320px;">![Alt](./assets/img-land.jpg "Title")</span>

The change ratio applied to the next calculation is called the `learning rate`, and it should be small enough to allow smooth transitions from one result to the other.

In most cases, even simple ones, the neural network will need intermediate layers of neurons, the `hidden layers`, so the network is flexible enough to travel to the desired state, where weights will be increased, making the network more rigid, but closer to the expected output.

If the network is not well designed for the purpose of the use case, it may never converge into a consistent result, or it may even diverge.

Here is an interactive playground to design a neural network and train it: <a href="../../" target="_blank">Neural Network Designer</a>

<div class="notes hi"></div>

<a href="../../" target="_blank">
  <img src="./assets/img-land.jpg" alt="Neural Network Designer (JR legacy test site)" style="width: 866px;"/>
</a>
<video src="./assets/vid-small.mp4" controls _autoplay loop alt="Content video" style="width: 866px;"></video>

<div class="no-display">
  <a href="./info.md">&lt; Prev</a> &nbsp; <a href="./info.md">Next &gt;</a>
</div>

<!-- Html comment -->
</div>
