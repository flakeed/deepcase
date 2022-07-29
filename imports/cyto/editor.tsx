import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Box } from '@chakra-ui/react';
import { useDeep } from '@deep-foundation/deeplinks/imports/client';
import { Link, MinilinksInstance, MinilinksResult, useMinilinksFilter } from '@deep-foundation/deeplinks/imports/minilinks';
import { ClientHandlerRenderer, evalClientHandler } from '../client-handler';
import { useLocalStore } from '@deep-foundation/store/local';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCytoEditor } from './hooks';
import { CytoReactLinkAvatar } from '../cyto-react-avatar';
import { EditorComponentView } from '../editor/editor-component-view';
import { EditorGrid } from '../editor/editor-grid';
import { EditorHandler } from '../editor/editor-handler';
import { EditorHandlers } from '../editor/editor-handlers';
import { EditorSwitcher } from '../editor/editor-switcher';
import { CloseButton, EditorTabs } from '../editor/editor-tabs';
import { EditorTextArea } from '../editor/editor-textarea';
import json5 from 'json5';
import { useBaseTypes } from '../hooks';
import { useDebounceCallback } from '@react-hook/debounce';
import { CatchErrors } from '../react-errors';

// global._callClientHandler = callClientHandler;
export interface EditorTab {
  id: number;
  saved: boolean;
  active?: boolean;
  loading?: boolean;
  initialValue?: string;
}

export function useEditorValues(tab) {
  const [values, setValues] = useLocalStore<any>('editor-values', {});
  const valuesRef = useRef<any>();
  valuesRef.current = values;
  const setValuesDebounced = useDebounceCallback((value) => {
    setValues(value);
  }, 500);
  return {
    valuesRef,
    value: values[tab],
    setValue: useCallback((id, value) => {
      setValuesDebounced({ ...valuesRef.current, [id]: value });
    }, []),
  };
}

export function useEditorTabs() {
  const [tabs, setTabs] = useLocalStore<EditorTab[]>('editor-tabs', []);
  const [tab, setTab] = useLocalStore<number>('editor-tab', 0);
  const tabsRef = useRef<any>();
  tabsRef.current = tabs;
  return {
    tabs,
    addTab: useCallback((tab) => {
      if (!tabsRef.current.find((t) => t.id === tab.id)) {
        setTabs([...tabsRef.current, tab]);
      }
    }, []),
    closeTab: useCallback((id) => {
      const newTabs = tabsRef.current.filter((tab) => tab.id !== id);
      setTabs(newTabs);
      if (newTabs.length) setTab(newTabs[newTabs.length - 1].id);
      else setTab(0);
    }, []),
    tabId: tab,
    tab: tabs.find((t) => +t.id === +tab),
    activeTab: useCallback((id) => {
      setTab(id);
    }, []),
    setTab: useCallback((tab) => {
      setTabs(tabsRef.current.map((t) => (t.id === tab.id ? tab : t)));
    }, []),
  };
}

const reasons = [
  {
    id: 1,
    name: 'type',
  },
  {
    id: 2,
    name: 'selector',
  },
  {
    id: 3,
    name: 'route',
  },
  {
    id: 4,
    name: 'schedule',
  },
];

export function CytoEditor({
  ml
}: {
  ml: MinilinksResult<Link<number>>;
}) {
  const [cytoEditor, setCytoEditor] = useCytoEditor();
  const [baseTypes, setBaseTypes] = useBaseTypes();
  const onClose = useCallback(() => {
    setCytoEditor(false);
  }, []);
  const deep = useDeep();

  const {
    tab,
    tabs,
    closeTab,
    setTab,
    activeTab,
    tabId,
  } = useEditorTabs();

  const {
    valuesRef,
    value,
    setValue,
  } = useEditorValues(tabId);

  const generatedLink = useMinilinksFilter(
    ml,
    (link) => {
      return link?.outByType[baseTypes.GeneratedFrom]?.[0]?.to_id === tabId;
    },
    (link, ml) => {
      return ml.byId[tabId]?.inByType[baseTypes.GeneratedFrom]?.[0]?.from;
    },
  )

  useEffect(() => {
    const value = generatedLink?.value?.value || tab?.initialValue;
    evalClientHandler({ value, deep }).then(({ data, error }) => {
      setComponent(() => data);
    });
  }, [tab?.initialValue, generatedLink]);

  const currentValue = valuesRef?.current?.[tabId] || tab?.initialValue || '';

  const refEditor = useRef();

  const [rightArea, setRightArea] = useState('preview');
  const [viewSize, setViewSize] = useState({width: 124, height: 123});

  const [Component, setComponent] = useState();

  const errorRenderer = useMemo(() => {
    return (error, reset) => {
      return <div>{json5.stringify(error)}</div>
    };
  }, []);

  return <>
    <Modal isOpen={cytoEditor} onClose={onClose} size='full'>
      <ModalOverlay />
      <ModalContent style={{ height: '100%' }}>
        <EditorGrid
          editorTextAreaElement={<>{[<EditorTextArea
            refEditor={refEditor}
            key={tabId}
            value={currentValue}
            onChange={(value) => {
              setValue(tabId, value);
              setTab({ ...tab, saved: tab.initialValue === value });
            }}
            onClose={() => {
              if (tabs.length === 1 && tabs[0]?.id === tab.id) onClose();
              closeTab(tabId);
              setValue(tabId, undefined);
            }}
            onSave={async (value) => {
              const Value = ml.byId[tab.id]?.type?.outByType?.[baseTypes.Value]?.[0]?.to_id;
              const table = Value === baseTypes.String ? 'strings' : Value === baseTypes.Number ? 'numbers' : Value === baseTypes.Object ? 'objects' : undefined;
              const type = Value === baseTypes.String ? 'string' : Value === baseTypes.Number ? 'number' : Value === baseTypes.Object ? 'object' : 'undefined';

              const _value = table === 'strings' ? value : table === 'numbers' ? parseFloat(value) : table === 'objects' ? json5.parse(value) : undefined;

              // setSavedValue(value);

              if (!ml.byId[tab.id]?.value) {
                await deep.insert({ link_id: tab.id, value: _value }, {
                  table: table,
                });
                setTab({ ...tab, initialValue: value, loading: false, saved: true });
              } else if (type !== 'undefined') {
                await deep.update({ link_id: { _eq: tab.id } }, {
                  value: _value,
                }, {
                  table: `${type}s`,
                });
                setTab({ ...tab, initialValue: value, loading: false, saved: true });
              } else {
                setTab({ ...tab, initialValue: value, loading: false, saved: false });
              }
            }}
          />]}</>}
          editorTabsElement={<EditorTabs
            tabs={tabs.map((tab) => ({
              ...tab,
              title: ml.byId[tab.id]?.inByType?.[baseTypes?.Contain]?.[0]?.value?.value || tab.id,
              active: tabId === tab.id,
            }))}
            onClose={(tab) => {
              if (tabs.length === 1 && tabs[0]?.id === tab.id) onClose();
              closeTab(tab.id);
              setValue(tabId, undefined);
            }}
            onClick={(tab) => {
              activeTab(tab.id);
              // @ts-ignore
              refEditor?.current?.editor?.focus();
            }}
          />}
          closeButtonElement={<CloseButton onClick={onClose}/>}
          editorRight={
            rightArea === 'handlers' && <EditorHandlers>
            <EditorHandler
              reasons={reasons} 
              avatarElement={<CytoReactLinkAvatar emoji='💥' />}
              title='first'
              sync={false}
              onChangeSync={() => {}}
            ></EditorHandler>
            </EditorHandlers> ||
            rightArea === 'preview' && <Box pos='relative'>
              <EditorComponentView
                defaultSize={viewSize}
                onChangeSize={(viewSize) => setViewSize(viewSize)}
              >
                <CatchErrors errorRenderer={errorRenderer}>
                  <ClientHandlerRenderer Component={Component}/>
                </CatchErrors>
              </EditorComponentView>
            </Box>
        }
          editorRightSwitch={<EditorSwitcher setArea={(rightArea) => {
            setRightArea(rightArea);
          }} />}
        />
      </ModalContent>
    </Modal>
  </>;
}