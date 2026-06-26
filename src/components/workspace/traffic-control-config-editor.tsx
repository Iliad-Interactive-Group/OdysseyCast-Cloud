'use client';

import type {
  SaveTrafficControlConfigRequest,
  TrafficControlCart,
  TrafficControlCommute,
  TrafficControlPronunciation,
  TrafficControlReplacement,
  TrafficControlVoice,
} from '@/lib/traffic-control-config.types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@iliad/ui';
import { PlusCircle, RefreshCw, Trash2 } from 'lucide-react';

interface TrafficControlConfigEditorProps {
  value: SaveTrafficControlConfigRequest['config'];
  rawJson: string;
  jsonError: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onChange: (next: SaveTrafficControlConfigRequest['config']) => void;
  onReload: () => void;
  onSave: () => void;
  onRawJsonChange: (next: string) => void;
  onApplyRawJson: () => void;
}

function makeId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function updateItem<T>(items: T[], index: number, next: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item));
}

function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function splitVariations(input: string): string[] {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function joinVariations(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

export function TrafficControlConfigEditor({
  value,
  rawJson,
  jsonError,
  isLoading,
  isSaving,
  onChange,
  onReload,
  onSave,
  onRawJsonChange,
  onApplyRawJson,
}: TrafficControlConfigEditorProps) {
  const commuteOptions = value.commutes;
  const voiceOptions = value.voices;

  const updateCarts = (next: TrafficControlCart[]) => {
    onChange({ ...value, carts: next });
  };

  const updateCommutes = (next: TrafficControlCommute[]) => {
    onChange({ ...value, commutes: next });
  };

  const updateVoices = (next: TrafficControlVoice[]) => {
    onChange({ ...value, voices: next });
  };

  const updateReplacements = (next: TrafficControlReplacement[]) => {
    onChange({ ...value, replacements: next });
  };

  const updatePronunciations = (next: TrafficControlPronunciation[]) => {
    onChange({ ...value, pronunciations: next });
  };

  return (
    <Card className="border-border/70 bg-background/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Traffic Control Configuration</CardTitle>
            <CardDescription>
              Structured editor for traffic operations config with optional raw JSON editing.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">carts {value.carts.length}</Badge>
            <Badge variant="outline">commutes {value.commutes.length}</Badge>
            <Badge variant="outline">voices {value.voices.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structured" className="space-y-4">
          <TabsList>
            <TabsTrigger value="structured">Structured</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="structured" className="space-y-4">
            <Accordion
              type="multiple"
              defaultValue={['commutes', 'voices', 'scheduler']}
              className="w-full"
            >
              <AccordionItem value="commutes">
                <AccordionTrigger>Commutes</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {value.commutes.map((commute, index) => (
                    <div
                      key={commute.id || `commute-${index}`}
                      className="space-y-3 rounded-md border border-border/70 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={commute.name}
                          onChange={(event) =>
                            updateCommutes(
                              updateItem(value.commutes, index, {
                                ...commute,
                                name: event.target.value,
                              }),
                            )
                          }
                          placeholder="Commute name"
                        />
                        <Input
                          value={commute.id}
                          onChange={(event) =>
                            updateCommutes(
                              updateItem(value.commutes, index, {
                                ...commute,
                                id: event.target.value,
                              }),
                            )
                          }
                          placeholder="Commute id"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        routes: {commute.routes.length} | incident bboxes:{' '}
                        {commute.incidentBboxes.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deep route and segment editing stays available in Raw JSON mode.
                      </p>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCommutes(removeItem(value.commutes, index))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Commute
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateCommutes([
                        ...value.commutes,
                        {
                          id: makeId('commute'),
                          name: '',
                          routes: [],
                          incidentBboxes: [],
                        },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Commute
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="voices">
                <AccordionTrigger>Voices</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {value.voices.map((voice, index) => (
                    <div
                      key={voice.id || `voice-${index}`}
                      className="space-y-3 rounded-md border border-border/70 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          value={voice.name}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                name: event.target.value,
                              }),
                            )
                          }
                          placeholder="Voice name"
                        />
                        <Input
                          value={voice.id}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, { ...voice, id: event.target.value }),
                            )
                          }
                          placeholder="Voice id"
                        />
                        <Input
                          value={voice.rate}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                rate: event.target.value,
                              }),
                            )
                          }
                          placeholder="Rate"
                        />
                        <Input
                          value={voice.pitch}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                pitch: event.target.value,
                              }),
                            )
                          }
                          placeholder="Pitch"
                        />
                        <Input
                          value={voice.volume}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                volume: event.target.value,
                              }),
                            )
                          }
                          placeholder="Volume"
                        />
                        <Input
                          type="number"
                          value={voice.breakMinMs}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                breakMinMs: Number(event.target.value || 0),
                              }),
                            )
                          }
                          placeholder="Break min ms"
                        />
                        <Input
                          type="number"
                          value={voice.breakMaxMs}
                          onChange={(event) =>
                            updateVoices(
                              updateItem(value.voices, index, {
                                ...voice,
                                breakMaxMs: Number(event.target.value || 0),
                              }),
                            )
                          }
                          placeholder="Break max ms"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateVoices(removeItem(value.voices, index))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Voice
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateVoices([
                        ...value.voices,
                        {
                          id: makeId('voice'),
                          name: '',
                          breakMinMs: 120,
                          breakMaxMs: 220,
                          rate: 'medium',
                          pitch: 'medium',
                          volume: 'medium',
                        },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Voice
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="replacements">
                <AccordionTrigger>Replacements</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {value.replacements.map((replacement, index) => (
                    <div
                      key={replacement.id || `replacement-${index}`}
                      className="grid gap-3 rounded-md border border-border/70 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        value={replacement.find}
                        onChange={(event) =>
                          updateReplacements(
                            updateItem(value.replacements, index, {
                              ...replacement,
                              find: event.target.value,
                            }),
                          )
                        }
                        placeholder="Find"
                      />
                      <Input
                        value={replacement.replace}
                        onChange={(event) =>
                          updateReplacements(
                            updateItem(value.replacements, index, {
                              ...replacement,
                              replace: event.target.value,
                            }),
                          )
                        }
                        placeholder="Replace"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateReplacements(removeItem(value.replacements, index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateReplacements([
                        ...value.replacements,
                        { id: makeId('replacement'), find: '', replace: '' },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Replacement
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pronunciations">
                <AccordionTrigger>Pronunciations</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {value.pronunciations.map((pronunciation, index) => (
                    <div
                      key={pronunciation.id || `pronunciation-${index}`}
                      className="space-y-3 rounded-md border border-border/70 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={pronunciation.localName}
                          onChange={(event) =>
                            updatePronunciations(
                              updateItem(value.pronunciations, index, {
                                ...pronunciation,
                                localName: event.target.value,
                              }),
                            )
                          }
                          placeholder="Local name"
                        />
                        <Input
                          value={pronunciation.id}
                          onChange={(event) =>
                            updatePronunciations(
                              updateItem(value.pronunciations, index, {
                                ...pronunciation,
                                id: event.target.value,
                              }),
                            )
                          }
                          placeholder="Pronunciation id"
                        />
                        <Textarea
                          className="md:col-span-2"
                          value={pronunciation.ssml}
                          onChange={(event) =>
                            updatePronunciations(
                              updateItem(value.pronunciations, index, {
                                ...pronunciation,
                                ssml: event.target.value,
                              }),
                            )
                          }
                          placeholder="SSML pronunciation"
                        />
                        <Input
                          className="md:col-span-2"
                          value={joinVariations(pronunciation.apiVariations)}
                          onChange={(event) =>
                            updatePronunciations(
                              updateItem(value.pronunciations, index, {
                                ...pronunciation,
                                apiVariations: splitVariations(event.target.value),
                              }),
                            )
                          }
                          placeholder="API variations (comma separated)"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updatePronunciations(removeItem(value.pronunciations, index))
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Pronunciation
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updatePronunciations([
                        ...value.pronunciations,
                        { id: makeId('pronunciation'), localName: '', ssml: '', apiVariations: [] },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Pronunciation
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prompts">
                <AccordionTrigger>Prompts</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <label className="space-y-2 text-sm">
                    <span className="text-muted-foreground">Consolidate and summarize</span>
                    <Textarea
                      value={value.prompts.consolidateAndSummarize}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          prompts: {
                            ...value.prompts,
                            consolidateAndSummarize: event.target.value,
                          },
                        })
                      }
                      className="min-h-24"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted-foreground">Generate traffic narrative</span>
                    <Textarea
                      value={value.prompts.generateTrafficNarrative}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          prompts: {
                            ...value.prompts,
                            generateTrafficNarrative: event.target.value,
                          },
                        })
                      }
                      className="min-h-24"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted-foreground">Create broadcast script</span>
                    <Textarea
                      value={value.prompts.createBroadcastScript}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          prompts: { ...value.prompts, createBroadcastScript: event.target.value },
                        })
                      }
                      className="min-h-24"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-muted-foreground">Generate SSML</span>
                    <Textarea
                      value={value.prompts.generateSsml}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          prompts: { ...value.prompts, generateSsml: event.target.value },
                        })
                      }
                      className="min-h-24"
                    />
                  </label>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="carts">
                <AccordionTrigger>Carts</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Build carts after commutes and voices so each cart links to existing runtime
                    pieces.
                  </p>
                  {value.carts.map((cart, index) => (
                    <div
                      key={cart.id || `cart-${index}`}
                      className="space-y-3 rounded-md border border-border/70 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={cart.name}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, { ...cart, name: event.target.value }),
                            )
                          }
                          placeholder="Cart name"
                        />
                        <Input
                          value={cart.id}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, { ...cart, id: event.target.value }),
                            )
                          }
                          placeholder="Cart id"
                        />
                        <Input
                          value={cart.startTime}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, {
                                ...cart,
                                startTime: event.target.value,
                              }),
                            )
                          }
                          placeholder="Start HH:MM"
                        />
                        <Input
                          value={cart.endTime}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, {
                                ...cart,
                                endTime: event.target.value,
                              }),
                            )
                          }
                          placeholder="End HH:MM"
                        />
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Commute</span>
                          <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={cart.commuteId}
                            onChange={(event) =>
                              updateCarts(
                                updateItem(value.carts, index, {
                                  ...cart,
                                  commuteId: event.target.value,
                                }),
                              )
                            }
                          >
                            <option value="">Select a commute</option>
                            {commuteOptions.map((commute) => (
                              <option key={commute.id} value={commute.id}>
                                {commute.name || commute.id}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Voice</span>
                          <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            value={cart.voiceName}
                            onChange={(event) =>
                              updateCarts(
                                updateItem(value.carts, index, {
                                  ...cart,
                                  voiceName: event.target.value,
                                }),
                              )
                            }
                          >
                            <option value="">Select a voice</option>
                            {voiceOptions.map((voice) => (
                              <option key={voice.id} value={voice.name}>
                                {voice.name || voice.id}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Input
                          className="md:col-span-2"
                          value={cart.saveDirectory}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, {
                                ...cart,
                                saveDirectory: event.target.value,
                              }),
                            )
                          }
                          placeholder="Save directory"
                        />
                        <Textarea
                          className="md:col-span-2"
                          value={cart.slotContext}
                          onChange={(event) =>
                            updateCarts(
                              updateItem(value.carts, index, {
                                ...cart,
                                slotContext: event.target.value,
                              }),
                            )
                          }
                          placeholder="Slot context"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCarts(removeItem(value.carts, index))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateCarts([
                        ...value.carts,
                        {
                          id: makeId('cart'),
                          name: '',
                          commuteId: commuteOptions[0]?.id ?? '',
                          startTime: '06:10',
                          endTime: '06:30',
                          voiceName: voiceOptions[0]?.name ?? '',
                          saveDirectory: '',
                          slotContext: '',
                        },
                      ])
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Cart
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scheduler">
                <AccordionTrigger>Scheduler</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <label className="space-y-2 text-sm">
                    <span className="text-muted-foreground">Minutes between runs</span>
                    <Input
                      type="number"
                      min={1}
                      value={value.scheduler.minutesBetweenRuns}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          scheduler: {
                            ...value.scheduler,
                            minutesBetweenRuns: Number(event.target.value || 1),
                          },
                        })
                      }
                    />
                  </label>

                  <div className="space-y-3 rounded-md border border-border/70 p-3">
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Automation running</span>
                      <Switch
                        checked={value.scheduler.isAutomationRunning}
                        onCheckedChange={(checked) =>
                          onChange({
                            ...value,
                            scheduler: { ...value.scheduler, isAutomationRunning: checked },
                          })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Use cache</span>
                      <Switch
                        checked={value.scheduler.useCache}
                        onCheckedChange={(checked) =>
                          onChange({
                            ...value,
                            scheduler: { ...value.scheduler, useCache: checked },
                          })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Skip first run on startup</span>
                      <Switch
                        checked={Boolean(value.scheduler.skipFirstRunOnStartup)}
                        onCheckedChange={(checked) =>
                          onChange({
                            ...value,
                            scheduler: { ...value.scheduler, skipFirstRunOnStartup: checked },
                          })
                        }
                      />
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="json" className="space-y-3">
            <Textarea
              className="min-h-72 font-mono text-xs"
              value={rawJson}
              onChange={(event) => onRawJsonChange(event.target.value)}
              placeholder="{ carts: [], commutes: [] }"
            />
            {jsonError ? <p className="text-xs text-destructive">{jsonError}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={onApplyRawJson}>
                Apply JSON to Editor
              </Button>
              <p className="text-xs text-muted-foreground">
                Use this for deep route and segment payload edits or bulk updates.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onReload} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Config
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            Save Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
