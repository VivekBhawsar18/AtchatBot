import './App.css';
import Chatbot from './components/Chatbot';
import background from './components/images/background.png'



function App() {
  return (
    <div className="App">

      <header className="App-header">
        <img src={background} alt="Chatbot Demo" height={"100%"} width={"100%"} />
      </header>
      <Chatbot />

    </div>
  );
}

export default App;
