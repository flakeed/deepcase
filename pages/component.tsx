
import { Box } from '@chakra-ui/react';
import { useMinilinksConstruct } from '@deep-foundation/deeplinks/imports/minilinks';
import dynamic from "next/dynamic";
import { ColorModeSwitcher } from '../imports/color-mode-toggle';
import { GridComponent } from '../imports/component/grid-component';
import { CytoGraphProps } from '../imports/cyto/types';
import { Provider } from '../imports/provider';

const CytoGraph = dynamic<CytoGraphProps>(
  () => import('../imports/cyto/graph').then((m) => m.default),
  { ssr: false }
);

export default function Page() {
  const minilinks = useMinilinksConstruct();
  const { ref: mlRef, ml } = minilinks;
  

  return (<>
    <Provider><>
      <ColorModeSwitcher/>
      <Box w='100%' h='4rem' />
      <GridComponent />
    </></Provider>
  </>);
}