import { Collapse } from 'antd'
import c from './LayersPaneContainer.module.css'

const LayersPaneContainer: React.FC = () => {
  return (
    <div className={c.container}>
      <Collapse
        defaultActiveKey={['CurrentSceneLayers']}
        ghost
      >
        <Collapse.Panel
          key={'CurrentSceneLayers'}
          header={'Layers'}
          style={{ height: '100%' }}
        >
          Active Layers array
        </Collapse.Panel>
        <Collapse.Panel
          key={'Globalobjects'}
          header={'Global objects'}
        >
          Global objects array
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}

export {
  LayersPaneContainer
}