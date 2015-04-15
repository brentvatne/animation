var CARDS = [
  ['react.png', 'React', '#222', '#fff'],
  ['angular.png', 'Angular', '#fff', '#000'],
];

var CARD_WIDTH = 320;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      card: CARDS[0],
      nextCard: CARDS[1],
      isTouching: false,
      currentX: new ValueBinding(0),
      currentY: new ValueBinding(-0.1),
      panGesture: new PanGesture({
        onStart: this.onStart.bind(this),
        onUpdate: this.onPanUpdate.bind(this),
        onEnd: this.onEnd.bind(this),
      }),
      flickAnimationX: null,
      flickAnimationY: null,
    };
  }

  // Just stops any existing animation
  onStart() {
    this.stopAnimations();
  }

  onPanUpdate(deltaX, deltaY) {
    var normalizedDeltaX = deltaX / window.innerWidth;
    this.state.currentX.update(this.state.currentX - normalizedDeltaX);

    var normalizedDeltaY = deltaY / window.innerHeight;
    this.state.currentY.update(this.state.currentY - normalizedDeltaY);
  }

  onAnimationUpdateX(deltaX) {
    this.state.currentX.update(this.state.currentX + deltaX);
  }

  onAnimationUpdateY(deltaY) {
    this.state.currentY.update(this.state.currentY + deltaY);
  }

  // Force animation to the given page
  animateToNextCard() {
    this.stopAnimations();

    this.setState({
      flickAnimationX: new Animation({
        easing: Easing.elastic(1, 2),
        from: +this.state.currentX,
        to: this.state.currentX > 0 ? 1 : -1,
        duration: 300,
        onUpdate: this.onAnimationUpdateX.bind(this),
        onEnd: this.showNextCard.bind(this),
      })
    });
  }

  stopAnimations() {
    this.state.flickAnimationX && this.state.flickAnimationX.stop();
    this.state.flickAnimationY && this.state.flickAnimationY.stop();
  }

  animateBackToStart() {
    this.setState({
      flickAnimationX: new Animation({
        easing: Easing.elastic(1, 2),
        from: +this.state.currentX,
        to: 0,
        duration: 200,
        onUpdate: this.onAnimationUpdateX.bind(this),
      }),
      flickAnimationY: new Animation({
        easing: Easing.elastic(1, 2),
        from: +this.state.currentY,
        to: -0.1,
        duration: 200,
        onUpdate: this.onAnimationUpdateY.bind(this),
      })
    });
  }

  showNextCard() {
    this.state.currentX.release();
    this.state.currentY.release();
    var card, nextCard;

    if (CARDS.indexOf(this.state.card) == 0) {
      card = CARDS[1];
      nextCard = CARDS[0];
    } else {
      card = CARDS[0];
      nextCard = CARDS[1];
    }

    this.setState({
      currentX: new ValueBinding(0),
      currentY: new ValueBinding(0),
      card: card,
      nextCard: nextCard,
    });
  }

  // Called when panning has completed
  onEnd(velocity) {
    if (velocity < -0.3 || velocity > 0.3 || Math.abs(this.state.currentX) > 0.5) {
      this.animateToNextCard();
    } else {
      this.animateBackToStart();
    }
  }

  imageStyle(image) {
    return {
      WebkitTransform: new TransformBinding({
        translateX: new Interpolation({
          inputRange: [-1, 0, 1],
          outputRange: [window.innerWidth, 0, -window.innerWidth],
          extrapolate: true,
        }).interpolate(this.state.currentX),

        translateY: new Interpolation({
          inputRange: [-1, 1],
          outputRange: [300, -300],
          extrapolate: false,
        }).interpolate(this.state.currentY),

        rotate: new Interpolation({
          inputRange: [-0.4, 0, 0.4],
          outputRange: [40, 0, -40],
          extrapolate: false,
        }).interpolate(this.state.currentX),

        scale: new Interpolation({
          inputRange: [-1, 0, 1],
          outputRange: [0.8, 1, 0.8],
          extrapolate: false,
        }).interpolate(this.state.currentX),
      }),

      transition: 'rotate 0.1s ease-in',
      width: CARD_WIDTH,
      height: 380,
      position: 'absolute',
      backgroundPosition: 'top',
      background: `url(${image[0]}) ${image[2]} no-repeat`,
      backgroundSize: 'contain',
      border: '1px solid #ccc',
      borderRadius: 4,
      zIndex: 10,
    }
  }

  nextImageStyle(image) {
    return {
      WebkitTransform: new TransformBinding({
        scale: new Interpolation({
          inputRange: [-0.8, 0, 0.8],
          outputRange: [1, 0, 1],
          extrapolate: false,
        }).interpolate(this.state.currentX),
      }),

      opacity: new Interpolation({
        inputRange: [-0.8, 0, 0.8],
        outputRange: [1, 0, 1],
        extrapolate: false,
      }).interpolate(this.state.currentX),

      transition: 'rotate 0.1s ease-in',
      width: CARD_WIDTH,
      height: 380,
      position: 'absolute',
      backgroundPosition: 'top',
      background: `url(${image[0]}) ${image[2]} no-repeat`,
      backgroundSize: 'contain',
      border: '1px solid #ccc',
      borderRadius: 4,
    }
  }

  noStyles() {
    return {
      WebkitTransform: new TransformBinding({
        scale: new Interpolation({
          inputRange: [0, 0.2],
          outputRange: [0, 0.9],
          extrapolate: false,
        }).interpolate(this.state.currentX),
      }),

      backgroundColor: 'rgba(200, 20, 20, 0.2)',
      color: 'rgba(200, 20, 20, 1)',
      padding: 15,
      position: 'absolute',
      fontFamily: 'Lato',
      top: -2,
      left: 10,
      borderRadius: 5,
      zIndex: 100,
    }
  }

  yesStyles() {
    return {
      WebkitTransform: new TransformBinding({
        scale: new Interpolation({
          inputRange: [-0.2, 0],
          outputRange: [0.9, 0],
          extrapolate: false,
        }).interpolate(this.state.currentX),
      }),

      backgroundColor: 'rgba(20, 150, 20, 0.2)',
      color: 'rgba(20, 150, 20, 1)',
      padding: 15,
      borderRadius: 5,
      position: 'absolute',
      fontFamily: 'Lato',
      top: -2,
      right: 5,
      zIndex: 100,
    }
  }

  render() {
    var card = this.state.card;
    var nextCard = this.state.nextCard;

    return (
      <div>
        <h3 style={this.noStyles()}>
          No thanks
        </h3>

        <h3 style={this.yesStyles()}>
          Yes please
        </h3>

        <div style={{ width: CARD_WIDTH, overflow: 'hidden', margin: '0 auto', }}>
          <div {...this.state.panGesture.getEvents()}>
            <div key={'image-' + card[1]} style={this.imageStyle(card)}>
              <h2 style={{position: 'absolute', bottom: 10, color: card[3], margin: 0, fontFamily: 'Lato', textAlign: 'center', left: 0, right: 0}}>
                {card[1]}
              </h2>
            </div>
          </div>
          <div key={'image-' + nextCard[1]} style={this.nextImageStyle(nextCard)}>
            <h2 style={{position: 'absolute', bottom: 10, color: nextCard[3], margin: 0, fontFamily: 'Lato', textAlign: 'center', left: 0, right: 0}}>
              {nextCard[1]}
            </h2>
          </div>
        </div>
      </div>
    );
  }
};

React.render(<App />, document.body);
