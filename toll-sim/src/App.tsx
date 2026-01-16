import { useEffect, useRef, useState } from 'react';
import { Simulation, type SimParams } from './core/Simulation';
import {
  DEFAULT_ACC, DEFAULT_LAMBDA, DEFAULT_MU,
  DEFAULT_A_MIN, DEFAULT_A_MAX, DEFAULT_D0, DEFAULT_BETA,
  DEFAULT_L, DEFAULT_B,
  LC_COOLDOWN, DEFAULT_SIGMA, DEFAULT_ALPHA, DEFAULT_P_MIN, DEFAULT_ETC_RATIO
} from './core/constants';
import { CanvasView } from './ui/CanvasView';
import { ControlPanel } from './ui/ControlPanel';
import { StatsPanel } from './ui/StatsPanel';
import './index.css';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  // Setup State
  const [setupL, setSetupL] = useState(DEFAULT_L);
  const [setupB, setSetupB] = useState(DEFAULT_B);

  // Simulation Ref
  const simRef = useRef<Simulation | null>(null);

  // Runtime State
  const [tick, setTick] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(200); // ms delay
  const [showMergeDebug, setShowMergeDebug] = useState(false); // New debug toggle
  const [params, setParams] = useState<SimParams>({
    L: DEFAULT_L,
    B: DEFAULT_B,
    lambda: DEFAULT_LAMBDA,
    a: DEFAULT_ACC,
    mu: DEFAULT_MU,
    serviceMode: 'fixed',
    useAdaptive: false,
    a_min: DEFAULT_A_MIN,
    a_max: DEFAULT_A_MAX,
    d_0: DEFAULT_D0,
    beta: DEFAULT_BETA,
    sigma: DEFAULT_SIGMA,
    alpha: DEFAULT_ALPHA,
    laneChangeCooldown: LC_COOLDOWN,
    p_min: DEFAULT_P_MIN,
    etcRatio: DEFAULT_ETC_RATIO
  });

  const handleStart = () => {
    try {
      if (setupB < setupL) {
        setError("Error: B (Booth Lanes) must be >= L (Highway Lanes)");
        return;
      }

      // Update params with setup values
      const initialParams: SimParams = {
        ...params,
        L: setupL,
        B: setupB
      };
      setParams(initialParams);

      const sim = new Simulation(initialParams);
      simRef.current = sim;
      setIsSetup(true);
      setError(null);
    } catch (e: any) {
      console.error("Initialization Error:", e);
      setError("Initialization Failed: " + e.toString());
    }
  };

  const handleParamChange = (newParams: Partial<SimParams>) => {
    const updated = { ...params, ...newParams };
    setParams(updated);
    if (simRef.current) {
      simRef.current.updateParams(updated);
    }
  };

  // Animation Loop
  useEffect(() => {
    if (!isSetup || !simRef.current) return;

    const intervalId = setInterval(() => {
      try {
        if (simRef.current) {
          simRef.current.step();
          setTick(t => t + 1);
        }
      } catch (e: any) {
        console.error("Simulation Step Error:", e);
        setError("Runtime Error: " + e.toString());
        clearInterval(intervalId);
      }
    }, simulationSpeed);

    return () => clearInterval(intervalId);
  }, [isSetup, simulationSpeed]);


  return (
    <div className="app-container">
      <h1>Toll Booth Simulation (CA Model)</h1>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {!isSetup ? (
        <div className="setup-panel">
          <h2>Simulation Setup</h2>
          <div className="control-group">
            <label>Number of Highway Lanes (L): {setupL}</label>
            <input
              type="range" min="1" max="5" step="1"
              value={setupL}
              onChange={(e) => setSetupL(parseInt(e.target.value))}
            />
          </div>
          <div className="control-group">
            <label>Number of Booth Lanes (B): {setupB}</label>
            <input
              type="range" min="1" max="10" step="1"
              value={setupB}
              onChange={(e) => setSetupB(parseInt(e.target.value))}
            />
          </div>
          <button className="start-btn" onClick={handleStart}>Start Simulation</button>
          <p className="hint">Constraint: B must be ≥ L</p>
        </div>
      ) : (
        <>
          <div className="main-layout">
            <div className="left-panel">
              <ControlPanel
                params={params}
                onParamChange={handleParamChange}
                simulationSpeed={simulationSpeed}
                onSpeedChange={setSimulationSpeed}
                showMergeDebug={showMergeDebug}
                onShowMergeDebugChange={setShowMergeDebug}
              />
              <div className="notes">
                <b>Logic Overview:</b>
                – <strong>L = {params.L}</strong> highway lanes, expanding to <strong>B = {params.B}</strong> booth lanes.<br />
                – Lane Changing permitted in green zone (Highway) and yellow zone (Fan-out).<br />
                – Red zone is locked (Commitment).
              </div>
            </div>

            <div className="center-panel">
              {simRef.current && (
                <CanvasView
                  grid={simRef.current.getGrid()}
                  tick={tick}
                  L={params.L}
                  showMergeDebug={showMergeDebug}
                />
              )}
            </div>

            <div className="right-panel">
              {simRef.current && (
                <StatsPanel
                  time={simRef.current.getStats().time}
                  passedCars={simRef.current.getStats().passedCars}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
