import React from 'react';
import type { SimParams } from '../core/Simulation';


interface ControlPanelProps {
    params: SimParams;
    onParamChange: (newParams: Partial<SimParams>) => void;
    simulationSpeed: number;
    onSpeedChange: (speed: number) => void;
    showMergeDebug: boolean;       // NEW
    onShowMergeDebugChange: (show: boolean) => void; // NEW
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ params, onParamChange, simulationSpeed, onSpeedChange, showMergeDebug, onShowMergeDebugChange }) => {
    return (
        <div className="panel-card">
            <div className="controls-container">
                {/* Visual Settings */}
                <div className="control-group">
                    <label
                        title="Điều chỉnh tốc độ hiển thị mô phỏng. Giá trị nhỏ = Nhanh hơn."
                        style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                    >
                        Tốc độ mô phỏng ({simulationSpeed}ms)
                    </label>
                    <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={simulationSpeed}
                        onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                        style={{ direction: 'rtl' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#888' }}>
                        <span>Nhanh</span>
                        <span>Chậm</span>
                    </div>
                </div>

                <div className="control-group">
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span title="Hiển thị mũi tên hướng dẫn và chi tiết logic nhập làn." style={{ cursor: 'help', borderBottom: '1px dotted #888' }}>
                            Show Merge Debug
                        </span>
                        <input
                            type="checkbox"
                            checked={showMergeDebug}
                            onChange={(e) => onShowMergeDebugChange(e.target.checked)}
                        />
                    </label>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '15px 0' }} />

                {/* Simulation Parameters */}
                <div className="control-group">
                    <label
                        title="Tỉ lệ lưu lượng xe. Xác suất một xe mới sẽ xuất hiện ở mỗi làn cao tốc trong mỗi giây."
                        style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                    >
                        λ (Mật độ xe đến) <span>{params.lambda}</span>
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={params.lambda}
                        onChange={(e) => onParamChange({ lambda: parseFloat(e.target.value) })}
                    />
                </div>

                <div className="control-group">
                    <label
                        title="Proportion of ETC vehicles in incoming traffic."
                        style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                    >
                        ETC Ratio <span>{params.etcRatio}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={params.etcRatio}
                        onChange={(e) => onParamChange({ etcRatio: parseFloat(e.target.value) })}
                    />
                </div>

                <div className="control-group">
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span title="Kích hoạt hành vi xe thích ứng thông minh dựa trên khoảng cách xe phía trước." style={{ cursor: 'help', borderBottom: '1px dotted #888' }}>
                            Phản ứng thích ứng
                        </span>
                        <input
                            type="checkbox"
                            checked={!!params.useAdaptive}
                            onChange={(e) => onParamChange({ useAdaptive: e.target.checked })}
                        />
                    </label>
                </div>

                {!params.useAdaptive ? (
                    <div className="control-group">
                        <label
                            title="Xác suất di chuyển cơ bản của xe (tương đương gia tốc/tốc độ)."
                            style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                        >
                            a (Khả năng đi tới) <span>{params.a}</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={params.a}
                            onChange={(e) => onParamChange({ a: parseFloat(e.target.value) })}
                        />
                    </div>
                ) : (
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '5px', borderRadius: '4px', marginBottom: '10px' }}>
                        <div className="control-group">
                            <label title="Xác suất di chuyển tối thiểu khi tắc đường." style={{ cursor: 'help' }}>
                                a<sub>min</sub> (Min) <span>{params.a_min}</span>
                            </label>
                            <input
                                type="range"
                                min="0.01"
                                max="1"
                                step="0.05"
                                value={params.a_min}
                                onChange={(e) => onParamChange({ a_min: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="control-group">
                            <label title="Xác suất di chuyển tối đa khi đường thoáng." style={{ cursor: 'help' }}>
                                a<sub>max</sub> (Max) <span>{params.a_max}</span>
                            </label>
                            <input
                                type="range"
                                min="0.01"
                                max="1"
                                step="0.05"
                                value={params.a_max}
                                onChange={(e) => onParamChange({ a_max: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="control-group">
                            <label title="Khoảng cách an toàn để xe bắt đầu giảm tốc." style={{ cursor: 'help' }}>
                                d<sub>0</sub> (Khoảng cách) <span>{params.d_0}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={params.d_0}
                                onChange={(e) => onParamChange({ d_0: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="control-group">
                            <label title="Độ nhạy của phản ứng thích ứng." style={{ cursor: 'help' }}>
                                β (Độ nhạy) <span>{params.beta}</span>
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={params.beta}
                                onChange={(e) => onParamChange({ beta: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="control-group">
                            <label
                                title="Xác suất di chuyển tối thiểu để ngăn tắc nghẽn khi mật độ cao. Giá trị 0 có thể gây deadlock."
                                style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                            >
                                p<sub>min</sub> (Xác suất tối thiểu) <span>{params.p_min}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1.0"
                                step="0.05"
                                value={params.p_min || 0.1}
                                onChange={(e) => onParamChange({ p_min: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                )}

                <div className="control-group">
                    <label
                        title="Thời gian (số bước) tối thiểu xe phải đợi giữa 2 lần đổi làn. Tăng giá trị để giảm việc đổi làn liên tục."
                        style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                    >
                        Cooldown (Đổi làn) <span>{params.laneChangeCooldown}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={params.laneChangeCooldown || 5}
                        onChange={(e) => onParamChange({ laneChangeCooldown: parseInt(e.target.value) })}
                    />
                </div>

                <div className="control-group">
                    <label
                        title="Độ nhạy tắc đường khi nhập làn (Merge). Giá trị cao = Nhập làn thận trọng hơn (chờ đường thoáng). Giá trị thấp = Nhập làn quyết liệt."
                        style={{ cursor: 'help', borderBottom: '1px dotted #888' }}
                    >
                        α (Độ nhạy nhập làn) <span>{params.alpha}</span>
                    </label>
                    <input
                        type="range"
                        min="0.0"
                        max="5.0"
                        step="0.1"
                        value={params.alpha || 2.0}
                        onChange={(e) => onParamChange({ alpha: parseFloat(e.target.value) })}
                    />
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '15px 0' }} />

                <div className="control-group">
                    <label title="Thời gian trung bình để phục vụ một xe tại trạm." style={{ cursor: 'help', borderBottom: '1px dotted #888' }}>
                        μ (Thời gian phục vụ) <span>{params.mu}</span>
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="30"
                        step="1"
                        value={params.mu}
                        onChange={(e) => onParamChange({ mu: parseFloat(e.target.value) })}
                    />
                </div>

                <div className="control-group radio-group">
                    <label style={{ marginBottom: '10px' }}>Chế độ phục vụ</label>

                    <label title="Thời gian phục vụ cố định.">
                        <input
                            type="radio"
                            name="ts"
                            value="fixed"
                            checked={params.serviceMode === 'fixed'}
                            onChange={() => onParamChange({ serviceMode: 'fixed' })}
                        />
                        <span>Cố định</span>
                    </label>
                    <label title="Thời gian phục vụ ngẫu nhiên theo phân phối mũ.">
                        <input
                            type="radio"
                            name="ts"
                            value="exp"
                            checked={params.serviceMode === 'exp'}
                            onChange={() => onParamChange({ serviceMode: 'exp' })}
                        />
                        <span>Phân phối mũ</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
