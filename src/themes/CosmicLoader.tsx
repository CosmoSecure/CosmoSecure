import styled from 'styled-components';

const CosmicLoader = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="loader">
          <p>loading</p>
          <div className="words">
            <span className="word">Vault</span>
            <span className="word">CosmoSecure</span>
            <span className="word">Security</span>
            <span className="word">Performance</span>
            <span className="word">Vault</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    /* color used to softly clip top and bottom of the .words container */
    // --bg-color: rgba(33, 33, 33, 0.5);
    background-color: rgba(33, 37, 41, 0.5);
    padding: 1rem 2rem;
    border-radius: 1.25rem;
    justify-content: center; // corrected spelling from 'justiry-content'
    align-items: center;
    display: flex;
    width: 99vw;
    height: 100vh;
  }
  .loader {
    color: rgb(124, 124, 124);
    font-family: "Poppins", sans-serif;
    font-weight: 1000;
    font-size: 30px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    border-radius: 8px;
  }

  .words {
    overflow: hidden;
    position: relative;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      transparent 10%,
      transparent 30%,
      transparent 70%,
      transparent 90%
    );
    z-index: 20;
  }

  .word {
    display: block;
    height: 100%;
    padding-left: 6px;
    padding-top: 2px;
    color: #956afa;
    animation: spin_4991 4s infinite;
  }

  @keyframes spin_4991 {
    10% {
      -webkit-transform: translateY(-102%);
      transform: translateY(-102%);
    }

    25% {
      -webkit-transform: translateY(-100%);
      transform: translateY(-100%);
    }

    35% {
      -webkit-transform: translateY(-202%);
      transform: translateY(-202%);
    }

    50% {
      -webkit-transform: translateY(-200%);
      transform: translateY(-200%);
    }

    60% {
      -webkit-transform: translateY(-302%);
      transform: translateY(-302%);
    }

    75% {
      -webkit-transform: translateY(-300%);
      transform: translateY(-300%);
    }

    85% {
      -webkit-transform: translateY(-402%);
      transform: translateY(-402%);
    }

    100% {
      -webkit-transform: translateY(-400%);
      transform: translateY(-400%);
    }
  }`;

export default CosmicLoader;
