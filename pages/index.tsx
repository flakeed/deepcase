import { Capacitor } from '@capacitor/core';
import { GLOBAL_ID_CONTAIN, GLOBAL_ID_PACKAGE, GLOBAL_ID_PROMISE, GLOBAL_ID_REJECTED, GLOBAL_ID_RESOLVED, GLOBAL_ID_THEN, useDeep } from '@deep-foundation/deeplinks/imports/client';
import { minilinks, MinilinkCollection, MinilinksGeneratorOptionsDefault, useMinilinks } from '@deep-foundation/deeplinks/imports/minilinks';
import { useTokenController } from '@deep-foundation/deeplinks/imports/react-token';
import { useApolloClient } from '@deep-foundation/react-hasura/use-apollo-client';
import { useLocalStore } from '@deep-foundation/store/local';
import { useQueryStore } from '@deep-foundation/store/query';
import { useTheme } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import { useDebounceCallback } from '@react-hook/debounce';
import axios from 'axios';
import json5 from 'json5';
import dynamic from 'next/dynamic';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { useClickEmitter } from '../imports/click-emitter';
import { EngineWindow, useEngineConnected } from '../imports/engine';
import { ForceGraph, ForceGraph2D, ForceGraph3D, ForceGraphVR, SpriteText } from '../imports/graph';
import { GUI, PaperPanel, useBackgroundTransparent, useBaseTypes, useClickSelect, useContainer, useContainerVisible, useForceGraph, useGraphiqlHeight, useInserting, useLabelsConfig, usePromises, useScreenFind, useShowMP, useShowTypes, useSpaceId, useWindowSize } from '../imports/gui';
import { LinkCard } from '../imports/link-card/index';
import { DeepLoader } from '../imports/loader';
import { Provider } from '../imports/provider';
import { Backdrop, Button, ButtonGroup, IconButton, makeStyles, Popover, Typography } from '../imports/ui';
import pckg from '../package.json';
import { useInterval } from 'usehooks-ts';
import isEqual from 'lodash/isEqual';
import remove from 'lodash/remove';
import isEqualWith from 'lodash/isEqualWith';
import copy from 'copy-to-clipboard';

// @ts-ignore
const Graphiql = dynamic(() => import('../imports/graphiql').then(m => m.Graphiql), { ssr: false });

type StyleProps = { connected: boolean; };
const connectedPosition = (style: any) => ({
  position: 'relative',
  transition: 'all 1s ease',
  ...style,
});

const useStyles = makeStyles((theme) => ({
  "@global": {
    body: ({ bgTransparent }: any) => ({
      backgroundColor: bgTransparent ? 'transparent' : theme?.palette?.background?.default,
    }),
  },
  root: ({ bgTransparent }: any) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: bgTransparent ? 'transparent' : theme?.palette?.background?.default,
    overflow: 'hidden',
    animation: '5s $deeplinksBackground ease'
  }),
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
  },
}));

export function useOperation() {
  return useLocalStore('dc-dg-operation', '');
}

export const AuthPanel = React.memo<any>(function AuthPanel() {
  const deep = useDeep();
  const [operation, setOperation] = useOperation();

  return <>
    <ButtonGroup variant="outlined">
      <Button disabled>{deep.linkId}</Button>
      <Button onClick={() => {
        copy(deep.token);
      }}>copy token</Button>
      <Button color={operation === 'auth' ? 'primary' : 'default'} onClick={() => setOperation(operation === 'auth' ? '' : 'auth')}>login</Button>
      <Button onClick={async () => {
        const g = await deep.guest({});
      }}>guest</Button>
      <Button onClick={() => deep.logout()}>logout</Button>
    </ButtonGroup>
  </>;
});

export function useSelectedLinks() {
  return useQueryStore('dc-dg-sl', []);
}

const defaultGraphiqlHeight = 300;

type IFocusLink = (id: number) => any;
export const DeepGraphContext = createContext<{ focusLink: IFocusLink }>({ focusLink: (id: number) => {} });
export function DeepGraphProvider({ children, focusLink }: { children: any; focusLink: IFocusLink }) {
  return <DeepGraphContext.Provider value={{ focusLink }}>
    {children}
  </DeepGraphContext.Provider>;
}
export function useDeepGraph() {
  return useContext(DeepGraphContext);
}

export function useFlyPanel() {
  return useState<any>();
};

export function PageContent() {
  const theme: any = useTheme();
  const [windowSize, setWindowSize] = useWindowSize();
  const [flyPanel, setFlyPanel] = useFlyPanel();

  const [showTypes, setShowTypes] = useShowTypes();
  const [promises, setPromises] = usePromises();
  const [showMP, setShowMP] = useShowMP();
  const [clickSelect, setClickSelect] = useClickSelect();
  const [container, setContainer] = useContainer();
  const [containerVisible, setContainerVisible] = useContainerVisible();
  const [forceGraph, setForceGraph] = useForceGraph();
  const [inserting, setInserting] = useInserting();
  const [screenFind, setScreenFind] = useScreenFind();
  const [labelsConfig, setLabelsConfig] = useLabelsConfig();
  const [spaceId, setSpaceId] = useSpaceId();

  const [selectedLinks, setSelectedLinks] = useSelectedLinks();
  const [operation, setOperation] = useOperation();
  const [connected, setConnected] = useEngineConnected();
  const [baseTypes, setBaseTypes] = useBaseTypes();
  const [bgTransparent] = useBackgroundTransparent();

  useEffect(() => {(async () => {
    setBaseTypes({
      containTree: await deep.id('@deep-foundation/core', 'containTree'),
      Contain: await deep.id('@deep-foundation/core', 'Contain'),
      Focus: await deep.id('@deep-foundation/core', 'Focus'),
      Query: await deep.id('@deep-foundation/core', 'Query'),
      Space: await deep.id('@deep-foundation/core', 'Space'),
      User: await deep.id('@deep-foundation/core', 'User'),
    });
  })()}, []);
  
  const classes = useStyles({ connected, bgTransparent });
  const deep = useDeep();

  useEffect(() => {
    // @ts-ignore
    global.axios = axios;
    const pl = Capacitor.getPlatform();
    if (pl === 'web') {
      // console.log(`platform is web, connection to server to ${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`);
      axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, { abc: 123 }).then(console.log, console.log);
    } else if (pl === 'electron') {
      // console.log(`platform is electron, connection to server to ${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`);
      axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, { def: 234 }).then(console.log, console.log);
    } else {
      // console.log(`platform is not detected, connection to server lost`);
    }
  }, []);

  const prevD = useRef<any>({});
  
  const minilinks = useMinilinks();
  global.minilinks = minilinks;
  const { ref: mlRef, ml } = minilinks;

  const isPromiseDeniedLink = useCallback((id) => !promises && [GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_RESOLVED, GLOBAL_ID_REJECTED].includes(id), [promises]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  useEffect(() => {
    const addedListener = (nl) => {
      // console.log('added', nl);
      setGraphData((graphData) => {
        const focus = nl?.inByType[baseTypes.Focus]?.find(f => f.from_id === spaceId);
        let optional = {};
        if (focus?.value?.value) {
          optional = {
            fx: focus?.value?.value?.x,
            fy: focus?.value?.value?.y,
            fz: focus?.value?.value?.z,
            x: focus?.value?.value?.x,
            y: focus?.value?.value?.y,
            z: focus?.value?.value?.z,
          };
        }

        const label: (string|number)[] = [];
        label.push(focus ? `[${nl?.id}]` : nl?.id);
        if (labelsConfig?.contains) (nl?.inByType?.[GLOBAL_ID_CONTAIN] || []).forEach(link => link?.value?.value && label.push(`${link?.value?.value}`));
        if (labelsConfig?.values && nl?.value?.value) {
          let json;
          try { json = json5.stringify(nl?.value.value); } catch(error) {}
          label.push(`value:${
            typeof(nl?.value.value) === 'object' && json
            ? json : nl?.value.value
          }`);
        }
        if (labelsConfig?.types) if (nl?.type?.value?.value) label.push(`type:${nl?.type?.value?.value}`);

        const labelArray = label.map((s: string) => (s.length > 30 ? `${s.slice(0, 30).trim()}...` : s));
        const labelString = labelArray.join('\n');

        // <isSelected>
        const isSelected = screenFind ? (
          nl?.linkId.toString() === screenFind || !!(labelString?.includes(screenFind))
          ) : selectedLinks?.find(id => id === nl?.linkId);
        // </isSelected>

        graphData.nodes.push({
          id: nl?.id,
          link: nl,
          labelArray,
          labelString,
          textColor: focus ? '#03a9f4': isSelected ? '#ffffff' : '#757575',
          ...optional,
        });

        const isTransparent = (
          (nl?.type_id === GLOBAL_ID_CONTAIN && nl?.from?.type_id === GLOBAL_ID_PACKAGE && !containerVisible)
        );

        if (nl?.from && !isPromiseDeniedLink(nl?.from?.type_id)) graphData.links.push({ id: `from--${nl?.id}`, source: nl?.id, target: nl?.from_id || nl?.id, link: nl, type: 'from', color: isTransparent ? 'transparent' : '#a83232' });
        if (nl?.to && !isPromiseDeniedLink(nl?.to?.type_id)) graphData.links.push({ id: `to--${nl?.id}`, source: nl?.id, target: nl?.to_id || nl?.id, link: nl, type: 'to', color: isTransparent ? 'transparent' : '#32a848' });
        return { nodes: graphData.nodes, links: graphData.links };
      });
    };
    const updatedListener = (ol, nl) => {
      // console.log('updated', ol, nl);
    };
    const removedListener = (olId) => {
      // console.log('removed', olId);
      setGraphData((graphData) => {
        remove(graphData.nodes, n => n.id === olId);
        remove(graphData.links, n => (
          n.id === olId ||
          n.id === `from--${olId}` ||
          n.id === `to--${olId}`
        ));
        return { nodes: graphData.nodes, links: graphData.links };
      });
    };
    ml.emitter.on('added', addedListener);
    ml.emitter.on('updated', updatedListener);
    ml.emitter.on('removed', removedListener);
    return () => {
      ml.emitter.removeListener('added', addedListener);
      ml.emitter.removeListener('updated', updatedListener);
      ml.emitter.removeListener('removed', removedListener);
    };
  }, []);

  const mouseMove = useRef<any>();
  const onNodeClickRef = useRef<any>();
  const clickEventEmitter = useClickEmitter();
  const onNodeClick = useDebounceCallback((node) => {
    if (operation === 'auth') {
      deep.login({ linkId: +node.link?.id });
      setOperation('');
    } else if (operation === 'delete') {
      deep.delete(node.link?.id);
      setOperation('');
    } else if (operation === 'from') {
      setInserting({ ...inserting, from: node.link?.id });
      setOperation('');
    } else if (operation === 'to') {
      setInserting({ ...inserting, to: node.link?.id });
      setOperation('');
    } else if (operation === 'type') {
      setInserting({ ...inserting, type: node.link?.id });
      setOperation('');
    } else if (operation === 'pipette') {
      setInserting({ ...inserting, from: node?.link?.from_id, to: node?.link?.to_id, type: node?.link?.type_id });
      setOperation('');
    } else if (operation === 'container') {
      setContainer(node.link?.id);
      setOperation('');
    } else if (clickSelect) {
      setFlyPanel({
        top: (mouseMove?.current?.clientY),
        left: (mouseMove?.current?.clientX),
        link: node?.link,
      });
    } else if (operation) {
      clickEventEmitter.emit(operation, node?.link);
    } else {
      if (!selectedLinks.find(i => i === node.link?.id)) setSelectedLinks([ ...selectedLinks, node.link?.id ]);
    }
  }, 500);
  onNodeClickRef.current = onNodeClick;

  const rootRef = useRef<any>();

  const fgRef = useRef<any>();
  const focusLink = useCallback((id: number) => {
    // const node = (graphData.nodes || [])?.find(n => n.id === id);

    // const distance = 40;
    // const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    // var dx = node.dx,
    //   dy = node.dy,
    //   dz = node.dz,
    //   x = node.x,
    //   y = node.y,
    //   z = node.z,
    //   scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / rootRef?.current.outerWidth, dy / rootRef?.current.outerHeight))),
    //   translate = [rootRef?.current.outerWidth / 2 - scale * x, rootRef?.current.outerHeight / 2 - scale * y];

    // try {
    //   fgRef.current.centerAt(x, y)
    // } catch(error) {}
    // try {
    //   fgRef?.current?.cameraPosition(
    //     { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    //     node, // lookAt ({ x, y, z })
    //     3000  // ms transition duration
    //   );
    // } catch(error) {}
  }, [/*graphData*/]);

  const holdRef = useRef<any>({});

  const forceGraph_linkAutoColorBy = useCallback((l) => l.color || '#fff', []);
  const forceGraph_linkLabel = useCallback(l => (
    l.type === 'by-item'
    ? `${l?.pos?.item_id}/${l?.pos?.path_item_id}/${l?.pos?.path_item_depth}(${l?.pos?.root_id})`
    : ''
  ), []);
  const forceGraph_linkCurvature = useCallback(l => (
    l.type === 'from'
    ? 0.25
    : l.type === 'to'
    ? -0.25
    : l.type === 'by-item'
    ? 0.1
    : 0
    ), []);
  const forceGraph_linkLineDash = useCallback(l => (
    l.type === 'by-item'
    ? [5, 5]
    : false
  ), []);
  const forceGraph_nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const fontSize = 12/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = (node?.textColor || '#707070');

    for (var i = 0; i < node.labelArray.length; i++)
      ctx.fillText(node.labelArray[i], node.x, node.y + (i * 12/globalScale) );
  }, []);
  const forceGraph_nodeThreeObject = useCallback(node => {
    const sprite = new SpriteText(node.labelString);
    sprite.color = (node?.textColor || '#707070');
    sprite.textHeight = 4;
    return sprite;
  } , []);
  const forceGraph_onNodeDrag = useCallback((node) => {
    // console.log('onNodeDrag');
    clearTimeout(holdRef.current.timeout);
    const { id, x, y, z, fx, fy, fz } = node;
    const focus = ml?.byId?.[id]?.inByType[baseTypes.Focus]?.find(f => f.from_id === spaceId);
    // console.log('findFocus', focus, id, baseTypes, ml);
    if (spaceId) {
      holdRef.current = {
        node,
        id, x, y, z, fx, fy, fz,
        fix: holdRef.current.id === id ? holdRef.current.fix : !!focus,
        needrehold: false,
        timeout: setTimeout(async () => {
          // console.log('onNodeDrag timeout');
          holdRef.current.needrehold = true;
          const focus = ml?.byId?.[id]?.inByType[baseTypes.Focus]?.find(f => f.from_id === spaceId);
          if (focus) {
            holdRef.current.fix = false;
            // console.log('unfocus', { id, x, y, z, fx, fy, fz });
            const where = { type_id: await deep.id('@deep-foundation/core', 'Focus'), from_id: spaceId, to_id: node.link?.id };
            await deep.delete(where);
            // console.log('unfocused');
          } else {
            holdRef.current.fix = true;
            // console.log('focus');
            const q = await deep.select({
              type_id: await deep.id('@deep-foundation/core', 'Focus'),
              from_id: spaceId,
              to_id: node.link?.id,
            });
            const oldFocusId = q?.data?.[0]?.id;
            let focusId = oldFocusId;
            if (!focusId) {
              const { data: [{ id: newFocusId }] } = await deep.insert({
                type_id: await deep.id('@deep-foundation/core', 'Focus'),
                from_id: spaceId,
                to_id: node.link?.id,
              });
              focusId = newFocusId;
            }
            node._focusId = focusId;
            await deep.insert({ link_id: focusId, value: { x, y, z } }, { table: 'objects', variables: { on_conflict: { constraint: 'objects_pkey', update_columns: 'value' } } });
            // console.log('focused');
          }
        }, 500),
      };
    }
  }, [ml]);
  const forceGraph_onNodeDragEnd = useCallback(async (node) => {
    // console.log('onNodeDragEnd');
    clearTimeout(holdRef.current.timeout);
    const { id, x, y, z, fx, fy, fz } = node;
    if (spaceId) {
      holdRef.current.needrehold = false;
      const focus = ml?.byId?.[id]?.inByType[baseTypes.Focus]?.find(f => f.from_id === spaceId);
      // console.log('fix', holdRef?.current?.fix, 'focus', !!focus);
      if (focus || holdRef?.current?.fix) {
        node.fx = x;
        node.fy = y;
        node.fz = z;
      } else {
        delete node.fx;
        delete node.fy;
        delete node.fz;
      }
      if (!holdRef?.current?.needrehold && focus) {
        node._dragged = true;
        await deep.update({ link_id: focus?.id }, { value: { x, y, z } }, { table: 'objects' });
      }
    }

    holdRef.current = {};
  }, [ml]);
  const forceGraph_onNodeClick = useCallback((node) => {
    onNodeClickRef.current(node);
  }, []);
  const forceGraph_onNodeRightClick = useCallback((node) => {
    if (node?.link?.type_id === baseTypes.Space) setSpaceId(node.link?.id);
  }, []);

  return <DeepGraphProvider focusLink={focusLink}>
    {[<DeepLoader
      key={spaceId}
      spaceId={spaceId}
      onChange={(results) => {
        // console.log('onChangeResults', results);
      }}

      minilinks={minilinks}

      // onUpdateScreenQuery={query => console.log('updateScreenQuery', query)}
    />]}
    <div
      ref={rootRef}
      className={classes.root}
      onMouseUp={(e) => clearTimeout(holdRef.current)}
    >
      <ReactResizeDetector
        handleWidth handleHeight
        onResize={(width, height) => setWindowSize({ width, height })}
      />
      <Popover
        open={!!flyPanel}
        anchorReference="anchorPosition"
        anchorPosition={flyPanel}
        onClose={() => setFlyPanel(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {!!flyPanel && <div style={{ position: 'relative' }}>
          <LinkCard link={flyPanel.link} ml={ml}/>
          <IconButton
            size="small" style={{ position: 'absolute', top: 6, right: 6 }}
            onClick={() => {
              setSelectedLinks([ ...selectedLinks, flyPanel.link?.id ]);
              setFlyPanel(null);
            }}
          ><Add/></IconButton>
        </div>}
      </Popover>
      {[<ForceGraph
        fgRef={fgRef}
        key={''+windowSize.width+windowSize.height}
        width={windowSize.width}
        height={windowSize.height}
        Component={
          forceGraph == '2d'
          ? ForceGraph2D
          : forceGraph == '3d'
          ? ForceGraph3D
          : ForceGraphVR
        }
        graphData={graphData}
        backgroundColor={bgTransparent ? 'transparent' : theme?.palette?.background?.default}
        // linkAutoColorBy={forceGraph_linkAutoColorBy}
        linkOpacity={1}
        linkWidth={0.5}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkLabel={forceGraph_linkLabel}
        linkCurvature={forceGraph_linkCurvature}
        linkLineDash={forceGraph_linkLineDash}
        nodeCanvasObject={forceGraph_nodeCanvasObject}
        nodeThreeObject={forceGraph != 'vr' ? forceGraph_nodeThreeObject : undefined}
        // nodeThreeObject={node => {
        //   return new Three.Mesh(
        //     [
        //       new Three.BoxGeometry(Math.random() * 20, Math.random() * 20, Math.random() * 20),
        //       new Three.ConeGeometry(Math.random() * 10, Math.random() * 20),
        //       new Three.CylinderGeometry(Math.random() * 10, Math.random() * 10, Math.random() * 20),
        //       new Three.DodecahedronGeometry(Math.random() * 10),
        //       new Three.SphereGeometry(Math.random() * 10),
        //       new Three.TorusGeometry(Math.random() * 10, Math.random() * 2),
        //       new Three.TorusKnotGeometry(Math.random() * 10, Math.random() * 2)
        //     ][node.link?.id%7],
        //     new Three.MeshLambertMaterial({
        //       color: Math.round(Math.random() * Math.pow(2, 24)),
        //       transparent: true,
        //       opacity: 0.75
        //     })
        //   );
        // }}
        // nodeThreeObject={node => {
        //   const _l = node.label || [];

        //   const isSelected = screenFind ? (
        //     node?.linkId.toString() === screenFind || !!(_l?.join(' ')?.includes(screenFind))
        //   ) : selectedLinks?.find(id => id === node?.linkId);

        //   const sprite = new SpriteText(_l.join(' '));
        //   sprite.color = isSelected ? '#fff' : '#707070';
        //   sprite.textHeight = 8;
        //   return new Three.Mesh(sprite);
        // }}
        onNodeDrag={forceGraph_onNodeDrag}
        onNodeDragEnd={forceGraph_onNodeDragEnd}
        onNodeClick={forceGraph_onNodeClick}
        onNodeRightClick={forceGraph_onNodeRightClick}
      />]}
      <GUI ml={ml}/>
      <Backdrop className={classes.backdrop} open={!connected}>
        <PaperPanel flying>
          <EngineWindow/>
          <Typography align='center'><Button disabled>{pckg.version}</Button></Typography>
        </PaperPanel>
      </Backdrop>
    </div>
  </DeepGraphProvider>;
}

export function PageConnected() {
  const [spaceId, setSpaceId] = useSpaceId();
  const deep = useDeep();
  const requestedRef = useRef(false);
  useEffect(() => {(async () => {
    let _linkId = deep?.linkId;
    if (!deep.token && !requestedRef.current) {
      requestedRef.current = true;
      const { token, linkId } = await deep.guest({});
      _linkId = linkId;
    }
    setSpaceId(deep?.linkId);
  })()}, [deep?.token]);
  return <>
    {!!deep.token && [<PageContent key={`${deep?.token || ''}-${deep?.linkId || ''}-${spaceId}`}/>]}
  </>
}

export default function Page() {
  return (
    <Provider>
      <PageConnected/>
    </Provider>
  );
}
