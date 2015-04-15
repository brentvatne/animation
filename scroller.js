var IMAGES = [
  ['http://brandonwalkin.com/slide-paper.jpg', 'Paper'],
  ['http://brandonwalkin.com/slide-origami.jpg', 'Origami'],
  ['http://brandonwalkin.com/slide-chatheads.jpg', 'Chat Heads'],
  ['http://brandonwalkin.com/slide-logo.png', 'Facebook Logo'],
  ['http://brandonwalkin.com/slide-swipe.jpg', 'Swipe'],
  ['http://brandonwalkin.com/slide-drawer.jpg', 'Drawer'],
  ['http://brandonwalkin.com/slide-capo.jpg', 'Capo'],
  ['http://brandonwalkin.com/slide-billings.jpg', 'Billings'],
];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 0,
      isTouching: false,
      current: new ValueBinding(0),
      panGesture: new PanGesture({
        horizontal: true,
        onStart: this.onStart.bind(this),
        onUpdate: this.onPanUpdate.bind(this),
        onEnd: this.onEnd.bind(this),
      }),
      labelInterpolation: {interpolate: () => 0},
      flickAnimation: null,
      labelCurrents: IMAGES.map(() => 1),
    };

    window.onkeydown = (event) => {
      if (event.keyCode === 37) { // left arrow
        this.animateToPage(this.state.currentPage - 1);
      } else if (event.keyCode === 39) { // right arrow
        this.animateToPage(this.state.currentPage + 1);
      }
    }
  }

  componentDidMount() {
    var labelAccWidths = [];
    var lastWidth = 0;

    [].slice.apply(this.refs.labels.getDOMNode().children).forEach((child, i) => {
      var width = child.getBoundingClientRect().width;
      console.log(-lastWidth);
      labelAccWidths.push(-lastWidth - width / 2);
      lastWidth += width;
    });

    console.log(labelAccWidths);

    this.setState({
      labelInterpolation: new Interpolation({
        inputRange: IMAGES.map((image, i) => i),
        outputRange: labelAccWidths,
        extrapolate: true,
      })
    });
  }

  // Just stops any existing animation
  onStart() {
    this.state.flickAnimation && this.state.flickAnimation.stop();
  }

  onPanUpdate(deltaX) {
    // Get the amount that was moved X as a percentage of the window
    var normalizedDeltaX = deltaX / window.innerWidth;

    // ???
    if (this.state.current < 0 || this.state.current > IMAGES.length - 1) {
      normalizedDeltaX /= 2;
    }

    console.log(this.state.current - normalizedDeltaX);
    // ???
    this.state.current.update(this.state.current - normalizedDeltaX);
  }

  // Called when the flickAnimation updates
  onAnimationUpdate(delta) {
    this.state.current.update(this.state.current + delta);
  }

  // Force animation to the given page
  animateToPage(page) {
    if (page < 0) {
      page = 0;
    }

    if (page > IMAGES.length - 1) {
      page = IMAGES.length - 1;
    }

    this.state.flickAnimation && this.state.flickAnimation.stop();
    this.setState({
      currentPage: page,
      flickAnimation: new Animation({
        easing: Easing.elastic(1, 2),
        from: +this.state.current,
        to: page,
        duration: 1500,
        onUpdate: this.onAnimationUpdate.bind(this),
      })
    });
  }

  // Called when panning has completed
  onEnd(velocity) {
    var nextPage = this.state.currentPage;

    // If you swipe really fast, change it
    if (velocity < -0.3) {
      nextPage++;
    } else if (velocity > 0.3) {
      nextPage--;
    // Or if you're closer to the next page than the current page
    } else if (Math.round(this.state.current) !== this.state.currentPage) {
      nextPage = Math.round(this.state.current);
    }

    this.animateToPage(nextPage);
  }

  imageStyle(image, i) {
    return {
      WebkitTransform: new TransformBinding({
        translateX: new Interpolation({
          inputRange: [i, i + 1],
          outputRange: [0, -window.innerWidth],
          extrapolate: true,
        }).interpolate(this.state.current),

        scale: new Interpolation({
          inputRange: [i - 1, i, i + 1],
          outputRange: [0.8, 1, 0.8],
          extrapolate: false,
        }).interpolate(this.state.current),
      }),

      top: 20,
      width: window.innerWidth,
      bottom: 50,
      position: 'absolute',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url(${image[0]})`,
      backgroundSize: 'contain',
    }
  }

  labelStyle(i) {
    return {
      fontFamily: "'HelveticaNeue-Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: 20,
      display: 'inline-block',
      lineHeight: 1.28,
      padding: '0 20px',

      opacity: new Interpolation({
        inputRange: [i - 1, i, i + 1],
        outputRange: [0.2, 1, 0.2],
        extrapolate: false,
      }).interpolate(this.state.current),

      WebkitTransform: new TransformBinding({
        scale: new Interpolation({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
          extrapolate: true,
        }).interpolate(this.state.labelCurrents[i])
      }),
    }
  }

  labelContainerStyle() {
    return {
      position: 'absolute',
      bottom: 32,
      left: '50%',
      whiteSpace: 'nowrap',
      WebkitTransform: new TransformBinding({
        translateX: this.state.labelInterpolation.interpolate(this.state.current),
      }),
    }
  }

  render() {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', }}
           {...this.state.panGesture.getEvents()}>

        { /* Images themselves */ }
        {IMAGES.map((image, i) => <div key={'image' + i} style={this.imageStyle(image, i)} />)}

        { /* Label container */ }
        <div style={this.labelContainerStyle()} ref="labels">

          { /* Labels */ }
          {IMAGES.map((image, i) =>
            <div onMouseDown={() => this.setLabelCurrent(i, 0)}
                 onMouseUp={() => this.setLabelCurrent(i, 1)}
                 onClick={() => this.animateToPage(i)}
                 key={'label' + i}
                 style={this.labelStyle(i)}>
              {image[1]}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Animates the pressing effect
  setLabelCurrent(labelID, current) {
    new Animation({
      easing: Easing.elastic(1, 2),
      from: this.state.labelCurrents[labelID],
      to: current,
      duration: 500,
      onUpdate: (delta) => {
        var labelCurrents = this.state.labelCurrents.concat();
        labelCurrents[labelID] = this.state.labelCurrents[labelID] + delta;
        this.setState({labelCurrents: labelCurrents});
      },
    });
  }
};

React.render(<App />, document.body);
