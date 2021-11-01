/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { Component, NgZone, Input, Output, EventEmitter, forwardRef, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { getEditorNamespace } from 'ckeditor4-integrations-common';
export class CKEditorComponent {
    constructor(elementRef, ngZone) {
        this.elementRef = elementRef;
        this.ngZone = ngZone;
        this.disableChangeEvent = false;
        /**
         * CKEditor 4 script url address. Script will be loaded only if CKEDITOR namespace is missing.
         *
         * Defaults to 'https://cdn.ckeditor.com/4.16.2/standard-all/ckeditor.js'
         */
        this.editorUrl = 'https://cdn.ckeditor.com/4.16.2/standard-all/ckeditor.js';
        /**
         * Tag name of the editor component.
         *
         * The default tag is `textarea`.
         */
        this.tagName = 'textarea';
        /**
         * The type of the editor interface.
         *
         * By default editor interface will be initialized as `classic` editor.
         * You can also choose to create an editor with `inline` interface type instead.
         *
         * See https://ckeditor.com/docs/ckeditor4/latest/guide/dev_uitypes.html
         * and https://ckeditor.com/docs/ckeditor4/latest/examples/fixedui.html
         * to learn more.
         */
        this.type = "classic" /* CLASSIC */;
        /**
         * Fired when the CKEDITOR https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR.html namespace
         * is loaded. It only triggers once, no matter how many CKEditor 4 components are initialised.
         * Can be used for convenient changes in the namespace, e.g. for adding external plugins.
         */
        this.namespaceLoaded = new EventEmitter();
        /**
         * Fires when the editor is ready. It corresponds with the `editor#instanceReady`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-instanceReady
         * event.
         */
        this.ready = new EventEmitter();
        /**
         * Fires when the editor data is loaded, e.g. after calling setData()
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#method-setData
         * editor's method. It corresponds with the `editor#dataReady`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dataReady event.
         */
        this.dataReady = new EventEmitter();
        /**
         * Fires when the content of the editor has changed. It corresponds with the `editor#change`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-change
         * event. For performance reasons this event may be called even when data didn't really changed.
         * Please note that this event will only be fired when `undo` plugin is loaded. If you need to
         * listen for editor changes (e.g. for two-way data binding), use `dataChange` event instead.
         */
        this.change = new EventEmitter();
        /**
         * Fires when the content of the editor has changed. In contrast to `change` - only emits when
         * data really changed thus can be successfully used with `[data]` and two way `[(data)]` binding.
         *
         * See more: https://angular.io/guide/template-syntax#two-way-binding---
         */
        this.dataChange = new EventEmitter();
        /**
         * Fires when the native dragStart event occurs. It corresponds with the `editor#dragstart`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dragstart
         * event.
         */
        this.dragStart = new EventEmitter();
        /**
         * Fires when the native dragEnd event occurs. It corresponds with the `editor#dragend`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-dragend
         * event.
         */
        this.dragEnd = new EventEmitter();
        /**
         * Fires when the native drop event occurs. It corresponds with the `editor#drop`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-drop
         * event.
         */
        this.drop = new EventEmitter();
        /**
         * Fires when the file loader response is received. It corresponds with the `editor#fileUploadResponse`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-fileUploadResponse
         * event.
         */
        this.fileUploadResponse = new EventEmitter();
        /**
         * Fires when the file loader should send XHR. It corresponds with the `editor#fileUploadRequest`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-fileUploadRequest
         * event.
         */
        this.fileUploadRequest = new EventEmitter();
        /**
         * Fires when the editing area of the editor is focused. It corresponds with the `editor#focus`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-focus
         * event.
         */
        this.focus = new EventEmitter();
        /**
         * Fires after the user initiated a paste action, but before the data is inserted.
         * It corresponds with the `editor#paste`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-paste
         * event.
         */
        this.paste = new EventEmitter();
        /**
         * Fires after the `paste` event if content was modified. It corresponds with the `editor#afterPaste`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-afterPaste
         * event.
         */
        this.afterPaste = new EventEmitter();
        /**
         * Fires when the editing view of the editor is blurred. It corresponds with the `editor#blur`
         * https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#event-blur
         * event.
         */
        this.blur = new EventEmitter();
        /**
         * If the component is read–only before the editor instance is created, it remembers that state,
         * so the editor can become read–only once it is ready.
         */
        this._readOnly = null;
        this._data = null;
        this._destroyed = false;
    }
    /**
     * Keeps track of the editor's data.
     *
     * It's also decorated as an input which is useful when not using the ngModel.
     *
     * See https://angular.io/api/forms/NgModel to learn more.
     */
    set data(data) {
        if (data === this._data) {
            return;
        }
        if (this.instance) {
            this.instance.setData(data);
            // Data may be changed by ACF.
            this._data = this.instance.getData();
            return;
        }
        this._data = data;
    }
    get data() {
        return this._data;
    }
    /**
     * When set to `true`, the editor becomes read-only.
     *
     * See https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#property-readOnly
     * to learn more.
     */
    set readOnly(isReadOnly) {
        if (this.instance) {
            this.instance.setReadOnly(isReadOnly);
            return;
        }
        // Delay setting read-only state until editor initialization.
        this._readOnly = isReadOnly;
    }
    get readOnly() {
        if (this.instance) {
            return this.instance.readOnly;
        }
        return this._readOnly;
    }
    ngAfterViewInit() {
        getEditorNamespace(this.editorUrl, namespace => {
            this.namespaceLoaded.emit(namespace);
        }).then(() => {
            // Check if component instance was destroyed before `ngAfterViewInit` call (#110).
            // Here, `this.instance` is still not initialized and so additional flag is needed.
            if (this._destroyed) {
                return;
            }
            this.ngZone.runOutsideAngular(this.createEditor.bind(this));
        }).catch(window.console.error);
    }
    ngOnDestroy() {
        this._destroyed = true;
        this.ngZone.runOutsideAngular(() => {
            if (this.instance) {
                this.instance.destroy();
                this.instance = null;
            }
        });
    }
    writeValue(value) {
        this.data = value;
    }
    registerOnChange(callback) {
        this.onChange = callback;
    }
    registerOnTouched(callback) {
        this.onTouched = callback;
    }
    createEditor() {
        const element = document.createElement(this.tagName);
        this.elementRef.nativeElement.appendChild(element);
        const instance = this.type === "inline" /* INLINE */
            ? CKEDITOR.inline(element, this.config)
            : CKEDITOR.replace(element, this.config);
        instance.once('instanceReady', evt => {
            this.instance = instance;
            // Read only state may change during instance initialization.
            this.readOnly = this._readOnly !== null ? this._readOnly : this.instance.readOnly;
            this.subscribe(this.instance);
            const undo = instance.undoManager;
            if (this.data !== null) {
                undo && undo.lock();
                instance.setData(this.data, { callback: () => {
                        // Locking undoManager prevents 'change' event.
                        // Trigger it manually to updated bound data.
                        if (this.data !== instance.getData()) {
                            undo ? instance.fire('change') : instance.fire('dataReady');
                        }
                        undo && undo.unlock();
                        this.ngZone.run(() => {
                            this.ready.emit(evt);
                        });
                    } });
            }
            else {
                this.ngZone.run(() => {
                    this.ready.emit(evt);
                });
            }
        });
    }
    subscribe(editor) {
        editor.on('focus', evt => {
            this.ngZone.run(() => {
                this.focus.emit(evt);
            });
        });
        editor.on('paste', evt => {
            this.ngZone.run(() => {
                this.paste.emit(evt);
            });
        });
        editor.on('afterPaste', evt => {
            this.ngZone.run(() => {
                this.afterPaste.emit(evt);
            });
        });
        editor.on('dragend', evt => {
            this.ngZone.run(() => {
                this.dragEnd.emit(evt);
            });
        });
        editor.on('dragstart', evt => {
            this.ngZone.run(() => {
                this.dragStart.emit(evt);
            });
        });
        editor.on('drop', evt => {
            this.ngZone.run(() => {
                this.drop.emit(evt);
            });
        });
        editor.on('fileUploadRequest', evt => {
            this.ngZone.run(() => {
                this.fileUploadRequest.emit(evt);
            });
        });
        editor.on('fileUploadResponse', evt => {
            this.ngZone.run(() => {
                this.fileUploadResponse.emit(evt);
            });
        });
        editor.on('blur', evt => {
            this.ngZone.run(() => {
                if (this.onTouched) {
                    this.onTouched();
                }
                this.blur.emit(evt);
            });
        });
        if (!this.disableChangeEvent) {
            editor.on('dataReady', this.propagateChange, this);
            if (this.instance.undoManager) {
                editor.on('change', this.propagateChange, this);
            }
            // If 'undo' plugin is not loaded, listen to 'selectionCheck' event instead. (#54).
            else {
                editor.on('selectionCheck', this.propagateChange, this);
            }
        }
    }
    propagateChange(event) {
        this.ngZone.run(() => {
            const newData = this.instance.getData();
            if (event.name === 'change') {
                this.change.emit(event);
            }
            else if (event.name === 'dataReady') {
                this.dataReady.emit(event);
            }
            if (newData === this.data) {
                return;
            }
            this._data = newData;
            this.dataChange.emit(newData);
            if (this.onChange) {
                this.onChange(newData);
            }
        });
    }
}
CKEditorComponent.decorators = [
    { type: Component, args: [{
                selector: 'ckeditor',
                template: '<ng-template></ng-template>',
                providers: [
                    {
                        provide: NG_VALUE_ACCESSOR,
                        useExisting: forwardRef(() => CKEditorComponent),
                        multi: true,
                    }
                ]
            },] }
];
CKEditorComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: NgZone }
];
CKEditorComponent.propDecorators = {
    disableChangeEvent: [{ type: Input }],
    config: [{ type: Input }],
    editorUrl: [{ type: Input }],
    tagName: [{ type: Input }],
    type: [{ type: Input }],
    data: [{ type: Input }],
    readOnly: [{ type: Input }],
    namespaceLoaded: [{ type: Output }],
    ready: [{ type: Output }],
    dataReady: [{ type: Output }],
    change: [{ type: Output }],
    dataChange: [{ type: Output }],
    dragStart: [{ type: Output }],
    dragEnd: [{ type: Output }],
    drop: [{ type: Output }],
    fileUploadResponse: [{ type: Output }],
    fileUploadRequest: [{ type: Output }],
    focus: [{ type: Output }],
    paste: [{ type: Output }],
    afterPaste: [{ type: Output }],
    blur: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2tlZGl0b3IuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NrZWRpdG9yL2NrZWRpdG9yLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0dBR0c7QUFFSCxPQUFPLEVBQ04sU0FBUyxFQUNULE1BQU0sRUFDTixLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixVQUFVLEVBQ1YsVUFBVSxFQUVWLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFFTixpQkFBaUIsRUFDakIsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQWtCbkUsTUFBTSxPQUFPLGlCQUFpQjtJQTZON0IsWUFBcUIsVUFBc0IsRUFBVSxNQUFjO1FBQTlDLGVBQVUsR0FBVixVQUFVLENBQVk7UUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBM04xRCx1QkFBa0IsR0FBRyxLQUFLLENBQUM7UUFTcEM7Ozs7V0FJRztRQUNNLGNBQVMsR0FBRywwREFBMEQsQ0FBQztRQUVoRjs7OztXQUlHO1FBQ00sWUFBTyxHQUFHLFVBQVUsQ0FBQztRQUU5Qjs7Ozs7Ozs7O1dBU0c7UUFDTSxTQUFJLDJCQUFzRDtRQW9EbkU7Ozs7V0FJRztRQUNPLG9CQUFlLEdBQUcsSUFBSSxZQUFZLEVBQXVCLENBQUM7UUFFcEU7Ozs7V0FJRztRQUNPLFVBQUssR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUUxRDs7Ozs7V0FLRztRQUNPLGNBQVMsR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUU5RDs7Ozs7O1dBTUc7UUFDTyxXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQXVCLENBQUM7UUFFM0Q7Ozs7O1dBS0c7UUFDTyxlQUFVLEdBQUcsSUFBSSxZQUFZLEVBQXVCLENBQUM7UUFFL0Q7Ozs7V0FJRztRQUNPLGNBQVMsR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUU5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Ozs7WUExQkEsVUFBVTtZQUxWLE1BQU07OztpQ0FrQ0wsS0FBSztxQkFPTCxLQUFLO3dCQU9MLEtBQUs7c0JBT0wsS0FBSzttQkFZTCxLQUFLO21CQVNMLEtBQUs7dUJBeUJMLEtBQUs7OEJBdUJMLE1BQU07b0JBT04sTUFBTTt3QkFRTixNQUFNO3FCQVNOLE1BQU07eUJBUU4sTUFBTTt3QkFPTixNQUFNO3NCQU9OLE1BQU07bUJBT04sTUFBTTtpQ0FPTixNQUFNO2dDQU9OLE1BQU07b0JBT04sTUFBTTtvQkFRTixNQUFNO3lCQU9OLE1BQU07bUJBT04sTUFBTSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2UgQ29weXJpZ2h0IChjKSAyMDAzLTIwMjEsIENLU291cmNlIC0gRnJlZGVyaWNvIEtuYWJiZW4uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBGb3IgbGljZW5zaW5nLCBzZWUgTElDRU5TRS5tZC5cbiAqL1xuXG5pbXBvcnQge1xuXHRDb21wb25lbnQsXG5cdE5nWm9uZSxcblx0SW5wdXQsXG5cdE91dHB1dCxcblx0RXZlbnRFbWl0dGVyLFxuXHRmb3J3YXJkUmVmLFxuXHRFbGVtZW50UmVmLFxuXHRBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3lcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7XG5cdENvbnRyb2xWYWx1ZUFjY2Vzc29yLFxuXHROR19WQUxVRV9BQ0NFU1NPUlxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5cbmltcG9ydCB7IGdldEVkaXRvck5hbWVzcGFjZSB9IGZyb20gJ2NrZWRpdG9yNC1pbnRlZ3JhdGlvbnMtY29tbW9uJztcblxuaW1wb3J0IHsgQ0tFZGl0b3I0IH0gZnJvbSAnLi9ja2VkaXRvcic7XG5cbmRlY2xhcmUgbGV0IENLRURJVE9SOiBhbnk7XG5cbkBDb21wb25lbnQoIHtcblx0c2VsZWN0b3I6ICdja2VkaXRvcicsXG5cdHRlbXBsYXRlOiAnPG5nLXRlbXBsYXRlPjwvbmctdGVtcGxhdGU+JyxcblxuXHRwcm92aWRlcnM6IFtcblx0XHR7XG5cdFx0XHRwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcblx0XHRcdHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCAoKSA9PiBDS0VkaXRvckNvbXBvbmVudCApLFxuXHRcdFx0bXVsdGk6IHRydWUsXG5cdFx0fVxuXHRdXG59IClcbmV4cG9ydCBjbGFzcyBDS0VkaXRvckNvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSwgQ29udHJvbFZhbHVlQWNjZXNzb3Ige1xuXG5cdEBJbnB1dCgpIGRpc2FibGVDaGFuZ2VFdmVudCA9IGZhbHNlO1xuXHQvKipcblx0ICogVGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGVkaXRvci5cblx0ICpcblx0ICogU2VlIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfY29uZmlnLmh0bWxcblx0ICogdG8gbGVhcm4gbW9yZS5cblx0ICovXG5cdEBJbnB1dCgpIGNvbmZpZz86IENLRWRpdG9yNC5Db25maWc7XG5cblx0LyoqXG5cdCAqIENLRWRpdG9yIDQgc2NyaXB0IHVybCBhZGRyZXNzLiBTY3JpcHQgd2lsbCBiZSBsb2FkZWQgb25seSBpZiBDS0VESVRPUiBuYW1lc3BhY2UgaXMgbWlzc2luZy5cblx0ICpcblx0ICogRGVmYXVsdHMgdG8gJ2h0dHBzOi8vY2RuLmNrZWRpdG9yLmNvbS80LjE2LjIvc3RhbmRhcmQtYWxsL2NrZWRpdG9yLmpzJ1xuXHQgKi9cblx0QElucHV0KCkgZWRpdG9yVXJsID0gJ2h0dHBzOi8vY2RuLmNrZWRpdG9yLmNvbS80LjE2LjIvc3RhbmRhcmQtYWxsL2NrZWRpdG9yLmpzJztcblxuXHQvKipcblx0ICogVGFnIG5hbWUgb2YgdGhlIGVkaXRvciBjb21wb25lbnQuXG5cdCAqXG5cdCAqIFRoZSBkZWZhdWx0IHRhZyBpcyBgdGV4dGFyZWFgLlxuXHQgKi9cblx0QElucHV0KCkgdGFnTmFtZSA9ICd0ZXh0YXJlYSc7XG5cblx0LyoqXG5cdCAqIFRoZSB0eXBlIG9mIHRoZSBlZGl0b3IgaW50ZXJmYWNlLlxuXHQgKlxuXHQgKiBCeSBkZWZhdWx0IGVkaXRvciBpbnRlcmZhY2Ugd2lsbCBiZSBpbml0aWFsaXplZCBhcyBgY2xhc3NpY2AgZWRpdG9yLlxuXHQgKiBZb3UgY2FuIGFsc28gY2hvb3NlIHRvIGNyZWF0ZSBhbiBlZGl0b3Igd2l0aCBgaW5saW5lYCBpbnRlcmZhY2UgdHlwZSBpbnN0ZWFkLlxuXHQgKlxuXHQgKiBTZWUgaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2d1aWRlL2Rldl91aXR5cGVzLmh0bWxcblx0ICogYW5kIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9leGFtcGxlcy9maXhlZHVpLmh0bWxcblx0ICogdG8gbGVhcm4gbW9yZS5cblx0ICovXG5cdEBJbnB1dCgpIHR5cGU6IENLRWRpdG9yNC5FZGl0b3JUeXBlID0gQ0tFZGl0b3I0LkVkaXRvclR5cGUuQ0xBU1NJQztcblxuXHQvKipcblx0ICogS2VlcHMgdHJhY2sgb2YgdGhlIGVkaXRvcidzIGRhdGEuXG5cdCAqXG5cdCAqIEl0J3MgYWxzbyBkZWNvcmF0ZWQgYXMgYW4gaW5wdXQgd2hpY2ggaXMgdXNlZnVsIHdoZW4gbm90IHVzaW5nIHRoZSBuZ01vZGVsLlxuXHQgKlxuXHQgKiBTZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaS9mb3Jtcy9OZ01vZGVsIHRvIGxlYXJuIG1vcmUuXG5cdCAqL1xuXHRASW5wdXQoKSBzZXQgZGF0YSggZGF0YTogc3RyaW5nICkge1xuXHRcdGlmICggZGF0YSA9PT0gdGhpcy5fZGF0YSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIHRoaXMuaW5zdGFuY2UgKSB7XG5cdFx0XHR0aGlzLmluc3RhbmNlLnNldERhdGEoIGRhdGEgKTtcblx0XHRcdC8vIERhdGEgbWF5IGJlIGNoYW5nZWQgYnkgQUNGLlxuXHRcdFx0dGhpcy5fZGF0YSA9IHRoaXMuaW5zdGFuY2UuZ2V0RGF0YSgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuX2RhdGEgPSBkYXRhO1xuXHR9XG5cblx0Z2V0IGRhdGEoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5fZGF0YTtcblx0fVxuXG5cdC8qKlxuXHQgKiBXaGVuIHNldCB0byBgdHJ1ZWAsIHRoZSBlZGl0b3IgYmVjb21lcyByZWFkLW9ubHkuXG5cdCAqXG5cdCAqIFNlZSBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI3Byb3BlcnR5LXJlYWRPbmx5XG5cdCAqIHRvIGxlYXJuIG1vcmUuXG5cdCAqL1xuXHRASW5wdXQoKSBzZXQgcmVhZE9ubHkoIGlzUmVhZE9ubHk6IGJvb2xlYW4gKSB7XG5cdFx0aWYgKCB0aGlzLmluc3RhbmNlICkge1xuXHRcdFx0dGhpcy5pbnN0YW5jZS5zZXRSZWFkT25seSggaXNSZWFkT25seSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIERlbGF5IHNldHRpbmcgcmVhZC1vbmx5IHN0YXRlIHVudGlsIGVkaXRvciBpbml0aWFsaXphdGlvbi5cblx0XHR0aGlzLl9yZWFkT25seSA9IGlzUmVhZE9ubHk7XG5cdH1cblxuXHRnZXQgcmVhZE9ubHkoKTogYm9vbGVhbiB7XG5cdFx0aWYgKCB0aGlzLmluc3RhbmNlICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuaW5zdGFuY2UucmVhZE9ubHk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX3JlYWRPbmx5O1xuXHR9XG5cblx0LyoqXG5cdCAqIEZpcmVkIHdoZW4gdGhlIENLRURJVE9SIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1IuaHRtbCBuYW1lc3BhY2Vcblx0ICogaXMgbG9hZGVkLiBJdCBvbmx5IHRyaWdnZXJzIG9uY2UsIG5vIG1hdHRlciBob3cgbWFueSBDS0VkaXRvciA0IGNvbXBvbmVudHMgYXJlIGluaXRpYWxpc2VkLlxuXHQgKiBDYW4gYmUgdXNlZCBmb3IgY29udmVuaWVudCBjaGFuZ2VzIGluIHRoZSBuYW1lc3BhY2UsIGUuZy4gZm9yIGFkZGluZyBleHRlcm5hbCBwbHVnaW5zLlxuXHQgKi9cblx0QE91dHB1dCgpIG5hbWVzcGFjZUxvYWRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZWRpdG9yIGlzIHJlYWR5LiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2luc3RhbmNlUmVhZHlgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtaW5zdGFuY2VSZWFkeVxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSByZWFkeSA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZWRpdG9yIGRhdGEgaXMgbG9hZGVkLCBlLmcuIGFmdGVyIGNhbGxpbmcgc2V0RGF0YSgpXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjbWV0aG9kLXNldERhdGFcblx0ICogZWRpdG9yJ3MgbWV0aG9kLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2RhdGFSZWFkeWBcblx0ICogaHR0cHM6Ly9ja2VkaXRvci5jb20vZG9jcy9ja2VkaXRvcjQvbGF0ZXN0L2FwaS9DS0VESVRPUl9lZGl0b3IuaHRtbCNldmVudC1kYXRhUmVhZHkgZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgZGF0YVJlYWR5ID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBjb250ZW50IG9mIHRoZSBlZGl0b3IgaGFzIGNoYW5nZWQuIEl0IGNvcnJlc3BvbmRzIHdpdGggdGhlIGBlZGl0b3IjY2hhbmdlYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWNoYW5nZVxuXHQgKiBldmVudC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgdGhpcyBldmVudCBtYXkgYmUgY2FsbGVkIGV2ZW4gd2hlbiBkYXRhIGRpZG4ndCByZWFsbHkgY2hhbmdlZC5cblx0ICogUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGV2ZW50IHdpbGwgb25seSBiZSBmaXJlZCB3aGVuIGB1bmRvYCBwbHVnaW4gaXMgbG9hZGVkLiBJZiB5b3UgbmVlZCB0b1xuXHQgKiBsaXN0ZW4gZm9yIGVkaXRvciBjaGFuZ2VzIChlLmcuIGZvciB0d28td2F5IGRhdGEgYmluZGluZyksIHVzZSBgZGF0YUNoYW5nZWAgZXZlbnQgaW5zdGVhZC5cblx0ICovXG5cdEBPdXRwdXQoKSBjaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIGNvbnRlbnQgb2YgdGhlIGVkaXRvciBoYXMgY2hhbmdlZC4gSW4gY29udHJhc3QgdG8gYGNoYW5nZWAgLSBvbmx5IGVtaXRzIHdoZW5cblx0ICogZGF0YSByZWFsbHkgY2hhbmdlZCB0aHVzIGNhbiBiZSBzdWNjZXNzZnVsbHkgdXNlZCB3aXRoIGBbZGF0YV1gIGFuZCB0d28gd2F5IGBbKGRhdGEpXWAgYmluZGluZy5cblx0ICpcblx0ICogU2VlIG1vcmU6IGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS90ZW1wbGF0ZS1zeW50YXgjdHdvLXdheS1iaW5kaW5nLS0tXG5cdCAqL1xuXHRAT3V0cHV0KCkgZGF0YUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgbmF0aXZlIGRyYWdTdGFydCBldmVudCBvY2N1cnMuIEl0IGNvcnJlc3BvbmRzIHdpdGggdGhlIGBlZGl0b3IjZHJhZ3N0YXJ0YFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWRyYWdzdGFydFxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBkcmFnU3RhcnQgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIHdoZW4gdGhlIG5hdGl2ZSBkcmFnRW5kIGV2ZW50IG9jY3Vycy4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNkcmFnZW5kYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWRyYWdlbmRcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgZHJhZ0VuZCA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgbmF0aXZlIGRyb3AgZXZlbnQgb2NjdXJzLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2Ryb3BgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtZHJvcFxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBkcm9wID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBmaWxlIGxvYWRlciByZXNwb25zZSBpcyByZWNlaXZlZC4gSXQgY29ycmVzcG9uZHMgd2l0aCB0aGUgYGVkaXRvciNmaWxlVXBsb2FkUmVzcG9uc2VgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtZmlsZVVwbG9hZFJlc3BvbnNlXG5cdCAqIGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIGZpbGVVcGxvYWRSZXNwb25zZSA9IG5ldyBFdmVudEVtaXR0ZXI8Q0tFZGl0b3I0LkV2ZW50SW5mbz4oKTtcblxuXHQvKipcblx0ICogRmlyZXMgd2hlbiB0aGUgZmlsZSBsb2FkZXIgc2hvdWxkIHNlbmQgWEhSLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2ZpbGVVcGxvYWRSZXF1ZXN0YFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWZpbGVVcGxvYWRSZXF1ZXN0XG5cdCAqIGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIGZpbGVVcGxvYWRSZXF1ZXN0ID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBlZGl0aW5nIGFyZWEgb2YgdGhlIGVkaXRvciBpcyBmb2N1c2VkLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2ZvY3VzYFxuXHQgKiBodHRwczovL2NrZWRpdG9yLmNvbS9kb2NzL2NrZWRpdG9yNC9sYXRlc3QvYXBpL0NLRURJVE9SX2VkaXRvci5odG1sI2V2ZW50LWZvY3VzXG5cdCAqIGV2ZW50LlxuXHQgKi9cblx0QE91dHB1dCgpIGZvY3VzID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyBhZnRlciB0aGUgdXNlciBpbml0aWF0ZWQgYSBwYXN0ZSBhY3Rpb24sIGJ1dCBiZWZvcmUgdGhlIGRhdGEgaXMgaW5zZXJ0ZWQuXG5cdCAqIEl0IGNvcnJlc3BvbmRzIHdpdGggdGhlIGBlZGl0b3IjcGFzdGVgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtcGFzdGVcblx0ICogZXZlbnQuXG5cdCAqL1xuXHRAT3V0cHV0KCkgcGFzdGUgPSBuZXcgRXZlbnRFbWl0dGVyPENLRWRpdG9yNC5FdmVudEluZm8+KCk7XG5cblx0LyoqXG5cdCAqIEZpcmVzIGFmdGVyIHRoZSBgcGFzdGVgIGV2ZW50IGlmIGNvbnRlbnQgd2FzIG1vZGlmaWVkLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2FmdGVyUGFzdGVgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtYWZ0ZXJQYXN0ZVxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBhZnRlclBhc3RlID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBGaXJlcyB3aGVuIHRoZSBlZGl0aW5nIHZpZXcgb2YgdGhlIGVkaXRvciBpcyBibHVycmVkLiBJdCBjb3JyZXNwb25kcyB3aXRoIHRoZSBgZWRpdG9yI2JsdXJgXG5cdCAqIGh0dHBzOi8vY2tlZGl0b3IuY29tL2RvY3MvY2tlZGl0b3I0L2xhdGVzdC9hcGkvQ0tFRElUT1JfZWRpdG9yLmh0bWwjZXZlbnQtYmx1clxuXHQgKiBldmVudC5cblx0ICovXG5cdEBPdXRwdXQoKSBibHVyID0gbmV3IEV2ZW50RW1pdHRlcjxDS0VkaXRvcjQuRXZlbnRJbmZvPigpO1xuXG5cdC8qKlxuXHQgKiBBIGNhbGxiYWNrIGV4ZWN1dGVkIHdoZW4gdGhlIGNvbnRlbnQgb2YgdGhlIGVkaXRvciBjaGFuZ2VzLiBQYXJ0IG9mIHRoZVxuXHQgKiBgQ29udHJvbFZhbHVlQWNjZXNzb3JgIChodHRwczovL2FuZ3VsYXIuaW8vYXBpL2Zvcm1zL0NvbnRyb2xWYWx1ZUFjY2Vzc29yKSBpbnRlcmZhY2UuXG5cdCAqXG5cdCAqIE5vdGU6IFVuc2V0IHVubGVzcyB0aGUgY29tcG9uZW50IHVzZXMgdGhlIGBuZ01vZGVsYC5cblx0ICovXG5cdG9uQ2hhbmdlPzogKCBkYXRhOiBzdHJpbmcgKSA9PiB2b2lkO1xuXG5cdC8qKlxuXHQgKiBBIGNhbGxiYWNrIGV4ZWN1dGVkIHdoZW4gdGhlIGVkaXRvciBoYXMgYmVlbiBibHVycmVkLiBQYXJ0IG9mIHRoZVxuXHQgKiBgQ29udHJvbFZhbHVlQWNjZXNzb3JgIChodHRwczovL2FuZ3VsYXIuaW8vYXBpL2Zvcm1zL0NvbnRyb2xWYWx1ZUFjY2Vzc29yKSBpbnRlcmZhY2UuXG5cdCAqXG5cdCAqIE5vdGU6IFVuc2V0IHVubGVzcyB0aGUgY29tcG9uZW50IHVzZXMgdGhlIGBuZ01vZGVsYC5cblx0ICovXG5cdG9uVG91Y2hlZD86ICgpID0+IHZvaWQ7XG5cblx0LyoqXG5cdCAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgZWRpdG9yIGNyZWF0ZWQgYnkgdGhpcyBjb21wb25lbnQuXG5cdCAqL1xuXHRpbnN0YW5jZTogYW55O1xuXG5cdC8qKlxuXHQgKiBJZiB0aGUgY29tcG9uZW50IGlzIHJlYWTigJNvbmx5IGJlZm9yZSB0aGUgZWRpdG9yIGluc3RhbmNlIGlzIGNyZWF0ZWQsIGl0IHJlbWVtYmVycyB0aGF0IHN0YXRlLFxuXHQgKiBzbyB0aGUgZWRpdG9yIGNhbiBiZWNvbWUgcmVhZOKAk29ubHkgb25jZSBpdCBpcyByZWFkeS5cblx0ICovXG5cdHByaXZhdGUgX3JlYWRPbmx5OiBib29sZWFuID0gbnVsbDtcblxuXHRwcml2YXRlIF9kYXRhOiBzdHJpbmcgPSBudWxsO1xuXG5cdHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKCBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIHByaXZhdGUgbmdab25lOiBOZ1pvbmUgKSB7fVxuXG5cdG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcblx0XHRnZXRFZGl0b3JOYW1lc3BhY2UoIHRoaXMuZWRpdG9yVXJsLCBuYW1lc3BhY2UgPT4ge1xuXHRcdFx0dGhpcy5uYW1lc3BhY2VMb2FkZWQuZW1pdCggbmFtZXNwYWNlICk7XG5cdFx0fSApLnRoZW4oICgpID0+IHtcblx0XHRcdC8vIENoZWNrIGlmIGNvbXBvbmVudCBpbnN0YW5jZSB3YXMgZGVzdHJveWVkIGJlZm9yZSBgbmdBZnRlclZpZXdJbml0YCBjYWxsICgjMTEwKS5cblx0XHRcdC8vIEhlcmUsIGB0aGlzLmluc3RhbmNlYCBpcyBzdGlsbCBub3QgaW5pdGlhbGl6ZWQgYW5kIHNvIGFkZGl0aW9uYWwgZmxhZyBpcyBuZWVkZWQuXG5cdFx0XHRpZiAoIHRoaXMuX2Rlc3Ryb3llZCApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhciggdGhpcy5jcmVhdGVFZGl0b3IuYmluZCggdGhpcyApICk7XG5cdFx0fSApLmNhdGNoKCB3aW5kb3cuY29uc29sZS5lcnJvciApO1xuXHR9XG5cblx0bmdPbkRlc3Ryb3koKTogdm9pZCB7XG5cdFx0dGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcblxuXHRcdHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCAoKSA9PiB7XG5cdFx0XHRpZiAoIHRoaXMuaW5zdGFuY2UgKSB7XG5cdFx0XHRcdHRoaXMuaW5zdGFuY2UuZGVzdHJveSgpO1xuXHRcdFx0XHR0aGlzLmluc3RhbmNlID0gbnVsbDtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH1cblxuXHR3cml0ZVZhbHVlKCB2YWx1ZTogc3RyaW5nICk6IHZvaWQge1xuXHRcdHRoaXMuZGF0YSA9IHZhbHVlO1xuXHR9XG5cblx0cmVnaXN0ZXJPbkNoYW5nZSggY2FsbGJhY2s6ICggZGF0YTogc3RyaW5nICkgPT4gdm9pZCApOiB2b2lkIHtcblx0XHR0aGlzLm9uQ2hhbmdlID0gY2FsbGJhY2s7XG5cdH1cblxuXHRyZWdpc3Rlck9uVG91Y2hlZCggY2FsbGJhY2s6ICgpID0+IHZvaWQgKTogdm9pZCB7XG5cdFx0dGhpcy5vblRvdWNoZWQgPSBjYWxsYmFjaztcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlRWRpdG9yKCk6IHZvaWQge1xuXHRcdGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCB0aGlzLnRhZ05hbWUgKTtcblx0XHR0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZCggZWxlbWVudCApO1xuXG5cdFx0Y29uc3QgaW5zdGFuY2U6IENLRWRpdG9yNC5FZGl0b3IgPSB0aGlzLnR5cGUgPT09IENLRWRpdG9yNC5FZGl0b3JUeXBlLklOTElORVxuXHRcdFx0PyBDS0VESVRPUi5pbmxpbmUoIGVsZW1lbnQsIHRoaXMuY29uZmlnIClcblx0XHRcdDogQ0tFRElUT1IucmVwbGFjZSggZWxlbWVudCwgdGhpcy5jb25maWcgKTtcblxuXHRcdGluc3RhbmNlLm9uY2UoICdpbnN0YW5jZVJlYWR5JywgZXZ0ID0+IHtcblx0XHRcdHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcblxuXHRcdFx0Ly8gUmVhZCBvbmx5IHN0YXRlIG1heSBjaGFuZ2UgZHVyaW5nIGluc3RhbmNlIGluaXRpYWxpemF0aW9uLlxuXHRcdFx0dGhpcy5yZWFkT25seSA9IHRoaXMuX3JlYWRPbmx5ICE9PSBudWxsID8gdGhpcy5fcmVhZE9ubHkgOiB0aGlzLmluc3RhbmNlLnJlYWRPbmx5O1xuXG5cdFx0XHR0aGlzLnN1YnNjcmliZSggdGhpcy5pbnN0YW5jZSApO1xuXG5cdFx0XHRjb25zdCB1bmRvID0gaW5zdGFuY2UudW5kb01hbmFnZXI7XG5cblx0XHRcdGlmICggdGhpcy5kYXRhICE9PSBudWxsICkge1xuXHRcdFx0XHR1bmRvICYmIHVuZG8ubG9jaygpO1xuXG5cdFx0XHRcdGluc3RhbmNlLnNldERhdGEoIHRoaXMuZGF0YSwgeyBjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHRcdC8vIExvY2tpbmcgdW5kb01hbmFnZXIgcHJldmVudHMgJ2NoYW5nZScgZXZlbnQuXG5cdFx0XHRcdFx0Ly8gVHJpZ2dlciBpdCBtYW51YWxseSB0byB1cGRhdGVkIGJvdW5kIGRhdGEuXG5cdFx0XHRcdFx0aWYgKCB0aGlzLmRhdGEgIT09IGluc3RhbmNlLmdldERhdGEoKSApIHtcblx0XHRcdFx0XHRcdHVuZG8gPyBpbnN0YW5jZS5maXJlKCAnY2hhbmdlJyApIDogaW5zdGFuY2UuZmlyZSggJ2RhdGFSZWFkeScgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dW5kbyAmJiB1bmRvLnVubG9jaygpO1xuXG5cdFx0XHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlYWR5LmVtaXQoIGV2dCApO1xuXHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0fSB9ICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnJlYWR5LmVtaXQoIGV2dCApO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9XG5cblx0cHJpdmF0ZSBzdWJzY3JpYmUoIGVkaXRvcjogYW55ICk6IHZvaWQge1xuXHRcdGVkaXRvci5vbiggJ2ZvY3VzJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmZvY3VzLmVtaXQoIGV2dCApO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGVkaXRvci5vbiggJ3Bhc3RlJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnBhc3RlLmVtaXQoIGV2dCApO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGVkaXRvci5vbiggJ2FmdGVyUGFzdGUnLCBldnQgPT4ge1xuXHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWZ0ZXJQYXN0ZS5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdkcmFnZW5kJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRyYWdFbmQuZW1pdCggZXZ0ICk7XG5cdFx0XHR9ICk7XG5cdFx0fSk7XG5cblx0XHRlZGl0b3Iub24oICdkcmFnc3RhcnQnLCBldnQgPT4ge1xuXHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuZHJhZ1N0YXJ0LmVtaXQoIGV2dCApO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGVkaXRvci5vbiggJ2Ryb3AnLCBldnQgPT4ge1xuXHRcdFx0dGhpcy5uZ1pvbmUucnVuKCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuZHJvcC5lbWl0KCBldnQgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cblx0XHRlZGl0b3Iub24oICdmaWxlVXBsb2FkUmVxdWVzdCcsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0dGhpcy5maWxlVXBsb2FkUmVxdWVzdC5lbWl0KGV2dCk7XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0ZWRpdG9yLm9uKCAnZmlsZVVwbG9hZFJlc3BvbnNlJywgZXZ0ID0+IHtcblx0XHRcdHRoaXMubmdab25lLnJ1biggKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmZpbGVVcGxvYWRSZXNwb25zZS5lbWl0KGV2dCk7XG5cdFx0XHR9ICk7XG5cdFx0fSApO1xuXG5cdFx0ZWRpdG9yLm9uKCAnYmx1cicsIGV2dCA9PiB7XG5cdFx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdFx0aWYgKCB0aGlzLm9uVG91Y2hlZCApIHtcblx0XHRcdFx0XHR0aGlzLm9uVG91Y2hlZCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5ibHVyLmVtaXQoIGV2dCApO1xuXHRcdFx0fSApO1xuXHRcdH0gKTtcblxuXHRcdGlmICghdGhpcy5kaXNhYmxlQ2hhbmdlRXZlbnQpIHtcblx0XHQgICAgZWRpdG9yLm9uKCAnZGF0YVJlYWR5JywgdGhpcy5wcm9wYWdhdGVDaGFuZ2UsIHRoaXMgKTtcblxuXHRcdCAgICBpZiAoIHRoaXMuaW5zdGFuY2UudW5kb01hbmFnZXIgKSB7XG5cdFx0ICAgIFx0ZWRpdG9yLm9uKCAnY2hhbmdlJywgdGhpcy5wcm9wYWdhdGVDaGFuZ2UsIHRoaXMgKTtcblx0XHQgICAgfVxuXHRcdCAgICAvLyBJZiAndW5kbycgcGx1Z2luIGlzIG5vdCBsb2FkZWQsIGxpc3RlbiB0byAnc2VsZWN0aW9uQ2hlY2snIGV2ZW50IGluc3RlYWQuICgjNTQpLlxuXHRcdCAgICBlbHNlIHtcblx0XHQgICAgXHRlZGl0b3Iub24oICdzZWxlY3Rpb25DaGVjaycsIHRoaXMucHJvcGFnYXRlQ2hhbmdlLCB0aGlzICk7XG5cdFx0ICAgIH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHByb3BhZ2F0ZUNoYW5nZSggZXZlbnQ6IGFueSApOiB2b2lkIHtcblx0XHR0aGlzLm5nWm9uZS5ydW4oICgpID0+IHtcblx0XHRcdGNvbnN0IG5ld0RhdGEgPSB0aGlzLmluc3RhbmNlLmdldERhdGEoKTtcblxuXHRcdFx0aWYgKCBldmVudC5uYW1lID09PSAnY2hhbmdlJyApIHtcblx0XHRcdFx0dGhpcy5jaGFuZ2UuZW1pdCggZXZlbnQgKTtcblx0XHRcdH0gZWxzZSBpZiAoIGV2ZW50Lm5hbWUgPT09ICdkYXRhUmVhZHknICkge1xuXHRcdFx0XHR0aGlzLmRhdGFSZWFkeS5lbWl0KCBldmVudCApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIG5ld0RhdGEgPT09IHRoaXMuZGF0YSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9kYXRhID0gbmV3RGF0YTtcblx0XHRcdHRoaXMuZGF0YUNoYW5nZS5lbWl0KCBuZXdEYXRhICk7XG5cblx0XHRcdGlmICggdGhpcy5vbkNoYW5nZSApIHtcblx0XHRcdFx0dGhpcy5vbkNoYW5nZSggbmV3RGF0YSApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fVxuXG59XG4iXX0=