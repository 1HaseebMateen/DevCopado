import { LightningElement, track, api, wire } from "lwc";
import NOTE_OBJECT from "@salesforce/schema/Note__c";
import insertNote from "@salesforce/apex/noteTaskLWC.insertNote";
import updateNote from "@salesforce/apex/noteTaskLWC.updateNote";
import fetchNote from "@salesforce/apex/noteTaskLWC.getNote";
import fetchNoteToUpdate from "@salesforce/apex/noteTaskLWC.getNoteToUpdate";
import pinNote from "@salesforce/apex/noteTaskLWC.pinNote";
import getPinned from "@salesforce/apex/noteTaskLWC.getPinned";
import { refreshApex } from "@salesforce/apex";
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class NoteTaskLWC extends NavigationMixin(LightningElement) {
    @track object = NOTE_OBJECT;
    @api recordId;
    @track flag = false;
    @track isLoading = false;
    @track pinnedData = null;
    @track filterChecked = false;
    @track editSubject;
    @track editDescription;
    @track editOpportunity;
    @track notes;
    @track fetchedNotes;
    saveCheck = false;
    insertedRecordId = null;
    showCreateNote = false;
    lastInsertedId = null;
    showUpdateNote = false;
    pinId;
    pinnedClass;
    previousNoteId = null;
    currentNoteId = null;
    allowChange = false;
    record;
    @track editNoteId;
    @track isShowModal = false;

    showModalBox() {
        this.isShowModal = true;
    }
    hideModalBox() {
        this.isShowModal = false;
    }
    handleEdit(event) {
        this.isLoading = true;
        this.showModalBox();
        this.editNoteId = event.currentTarget.dataset.key;
        this.editSubject = null;
        this.editDescription = null;
        this.editOpportunity = null;
        fetchNoteToUpdate({ recordId: this.editNoteId })
            .then((result) => {
                this.object.Subject__c = result[0].Subject__c;
                this.object.Description__c = result[0].Description__c;
                this.object.Opportunity__c = result[0].Opportunity__c;
                this.editSubject = result[0].Subject__c;
                this.editDescription = result[0].Description__c;
                this.editOpportunity = result[0].Opportunity__c;
                this.isLoading = false;
            })
            .catch((error) => {
                this.error = error.message;
                console.log(this.error);
            });
    }
    handleDelete(event) {
        this.isLoading = true;
        this.deleteNoteId = event.currentTarget.dataset.key;
        this.filterChecked = false;
        deleteRecord(this.deleteNoteId)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })
                );
                this.isLoading = false;
                refreshApex(this.notes);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
    @wire(fetchNote, { recordId: '$recordId' })
    wiredNotes(result) {
        const { error, data } = result;
        this.notes = result;
        if (data) {
            this.record = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.notes = undefined;
        }
    }
    handleOpportunity(event) {
        // Get the Opportunity Id from the event
        const oppId = event.target.dataset.id;

        // Navigate to the Opportunity record page
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: oppId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
    }
    handleAddNote(event) {
        this.showEditField = true;
        this.createNewNote(event);
        this.filterChecked = false;
    }
    OutputToEdit(event) {
        // this.showUpdateNote = true;
        this.insertedRecordId = event.currentTarget.dataset.key;
        this.tempid = event.currentTarget.dataset.key;
        // Section to handle Saves on Clicking outside
        //---------------------------------------Start------------------------------------
        if (this.currentNoteId === null) {
            this.currentNoteId = this.insertedRecordId;
        }
        if (this.currentNoteId !== this.insertedRecordId) {
            this.previousNoteId = this.currentNoteId;
            this.currentNoteId = this.insertedRecordId;
            // this.allowChange = true;
        }
        // if (this.previousNoteId === null && this.currentNoteId !== null) {
        //     this.allowChange = true;
        // }
        if (this.pinnedClass !== true) {
            const EditRows = this.template.querySelectorAll(
                'div[data-name="edit-note"]'
            );
            EditRows.forEach((div) => {
                if (div.dataset.key === this.insertedRecordId) {
                    this.showUpdateNote = true;
                    const ViewRows = this.template.querySelectorAll(
                        'div[data-name="view-note"]'
                    );
                    ViewRows.forEach((Viewdiv) => {
                        if (Viewdiv.dataset.key === this.insertedRecordId) {
                            Viewdiv.style.display = "none";
                        } else {
                            Viewdiv.style.display = "block";
                        }
                    });
                    div.style.display = "block";
                } else {
                    div.style.display = "none";
                }
            });
            fetchNoteToUpdate({ recordId: this.insertedRecordId })
                .then((result) => {
                    this.object.Subject__c = result[0].Subject__c;
                    this.object.Description__c = result[0].Description__c;
                    this.object.Opportunity__c = result[0].Opportunity__c;
                })
                .catch((error) => {
                    this.error = error.message;
                    console.log(this.error);
                });
        }
        this.pinnedClass = false;
    }

    handleUpdateNew(event) {
        this.insertedRecordId = event.currentTarget.value;
        this.handleUpdate(event);
    }
    handleUpdateExisting(event) {
        this.insertedRecordId = event.currentTarget.dataset.key;
        this.showCreateNote = false;
        this.filterChecked = false;
        this.handleUpdate(event);
    }
    @api async handleUpdate(event, noteId, saveCheck) {
        this.hideModalBox();
        this.isLoading = true;
        if (saveCheck === true && noteId !== null && noteId !== undefined) {
            this.insertedRecordId = noteId;
        }
        await updateNote({ recordId: this.insertedRecordId, record: this.object })
            .then((result) => {
                const EditRows = this.template.querySelectorAll(
                    'div[data-name="edit-note"]'
                );
                EditRows.forEach((div) => {
                    if (div.dataset.key === this.insertedRecordId) {
                        const ViewRows = this.template.querySelectorAll(
                            'div[data-name="view-note"]'
                        );
                        ViewRows.forEach((Viewdiv) => {
                            if (Viewdiv.dataset.key === this.insertedRecordId) {
                                Viewdiv.style.display = "block";
                            }
                        });
                        div.style.display = "none";
                    }
                });
                this.showCreateNote = false;
                this.insertedRecordId = null;
                this.allowChange = false;
                this.object = NOTE_OBJECT;
                this.editNoteId = null;
                this.flag = false;
                refreshApex(this.notes);
                this.isLoading = false;

            })
            .catch((error) => {
                this.error = error.message;
                console.log(this.error);
            });
    }
    @api async createNewNote(event) {
        this.object.Subject__c = null;
        this.object.Name = null;
        this.object.Opportunity__c = null;
        this.object.Description__c = null;
        this.isLoading = true;
        this.flag = true;
        await insertNote({ record: this.object })
            .then((result) => {
                this.insertedRecordId = result.Id;
                this.lastInsertedId = result.Id;
                this.showCreateNote = true;
                this.isLoading = false;
            })
            .catch((error) => {
                this.error = error.message;
                console.log(this.error);
            });
        this.allowChange = true;
    }
    handleSub(event) {
        this.object.Subject__c = event.target.value;
        this.allowChange = true;
    }
    handleDesc(event) {
        this.object.Description__c = event.target.value;
        this.allowChange = true;
    }
    handleOpp(event) {
        this.object.Opportunity__c = event.target.value;
        this.allowChange = true;
    }
    pinned = true;
    handlePin(event) {
        this.isLoading = true;
        this.pinId = event.currentTarget.dataset.key;
        this.pinVal = event.currentTarget.dataset.name;
        this.pinnedClass = true;
        this.pinned = !this.pinned;
        if (this.pinned) {
            event.target.iconName = 'utility:pinned';
        } else if (!this.pinned) {
            event.target.iconName = 'utility:pin';
        }

        pinNote({ recordId: this.pinId })
            .then((result) => {
                if (this.filterChecked) {
                    getPinned({ recordId: this.recordId })
                        .then((result1) => {
                            this.notes.data = result1;
                            this.isLoading = false;
                            refreshApex(this.notes.data);
                        })
                        .catch((error) => {
                            this.error = error.message;
                            console.log(this.error);
                        });
                }
                if (!this.filterChecked) {
                    this.notes.data = this.record;
                    refreshApex(this.notes);
                }
                this.isLoading = false;
            })
            .catch((error) => {
                this.error = error.message;
                this.isLoading = false;
                console.log(this.error);
            });
    }

    toggleFilter(event) {
        this.isLoading = true;
        if (this.filterChecked) {
            this.filterChecked = false;
        } else if (!this.filterChecked) {
            this.filterChecked = true;
        }
        if (this.filterChecked) {
            getPinned({ recordId: this.recordId })
                .then((result) => {
                    this.notes.data = result;
                    refreshApex(this.notes);
                    this.isLoading = false;
                })
                .catch((error) => {
                    this.error = error.message;
                    console.log(this.error);
                });
        }
        if (!this.filterChecked) {
            this.isLoading = true;
            this.notes.data = this.record;
            refreshApex(this.notes);
            this.isLoading = false;
        }
    }
    handleOnselect(event) {
        this.pinnedClass = true;
    }
    handleSave(event) {
        let targetElement = event.target.className; // clicked element
        console.log('inserted id -------> '+ this.insertedRecordId);
        console.log('last result id -------> '+ this.lastInsertedId);
        console.log('current id -------> '+ this.currentNoteId);
        console.log('previous id -------> '+ this.previousNoteId);
        console.log('show create note -------> '+ this.showCreateNote);

        const containerAddNote = this.template.querySelector('.add-note-div');
        const containerViewNote = this.template.querySelector('.view-note-div');
        const containerIconNote = this.template.querySelector('.icons') ? this.template.querySelector('.icons') : '';
        console.log(containerIconNote +' hello ');
        if (targetElement === "card-body") {
            if (this.previousNoteId === null && this.currentNoteId !== null && (this.previousNoteId !== this.currentNoteId) && this.allowChange === true) {
                this.saveCheck = true;
                console.log("condition 1");
                this.isLoading = true;
                this.handleUpdate(event, this.insertedRecordId, this.saveCheck);
                this.isLoading = false;
                this.saveCheck = false;
                this.allowChange = false;
            }

            if (this.previousNoteId === null && this.currentNoteId === null && this.insertedRecordId !== null && this.allowChange === true) {

                this.saveCheck = true;
                console.log("condition 2");
                this.handleUpdate(event, this.insertedRecordId, this.saveCheck);
                this.saveCheck = false;
                this.allowChange = false;
            }
        }
        if (this.allowChange === false && !containerAddNote.contains(event.target) && targetElement !== 'slds-form-element slds-form-element_stacked' && !containerViewNote.contains(event.target)) {
            console.log('closing edit condition')
            const EditRows = this.template.querySelectorAll(
                'div[data-name="edit-note"]'
            );
            EditRows.forEach((div) => {
                const ViewRows = this.template.querySelectorAll('div[data-name="view-note"]');
                ViewRows.forEach((Viewdiv) => {
                    Viewdiv.style.display = "block";
                });
                div.style.display = "none";
            });
        }

        if (!containerAddNote.contains(event.target) && targetElement !== 'slds-form-element slds-form-element_stacked' && !containerIconNote.contains(event.target)) {
            if ((this.previousNoteId !== null && this.currentNoteId !== null) && (this.previousNoteId !== this.currentNoteId) && this.allowChange === true && containerViewNote.contains(event.target) && this.showCreateNote !== true) {
                this.saveCheck = true;
                console.log("condition 3");
                this.isLoading = true;
                this.handleUpdate(event, this.previousNoteId, this.saveCheck);
                this.saveCheck = false;
                this.isLoading = false;
                this.allowChange = false;
            }
            if ((this.previousNoteId !== null && this.currentNoteId !== null) && (this.previousNoteId !== this.currentNoteId) && this.allowChange === true && (!containerViewNote.contains(event.target)) && this.insertedRecordId === null) {
                this.saveCheck = true;
                this.isLoading = true;
                console.log("condition 4");
                this.handleUpdate(event, this.currentNoteId, this.saveCheck);
                this.saveCheck = false;
                this.isLoading = false;
                this.allowChange = false;
            }
            if ((this.previousNoteId !== null && this.currentNoteId !== null) && (this.previousNoteId !== this.currentNoteId) && this.allowChange === true && !containerViewNote.contains(event.target) && this.insertedRecordId !== null && this.flag === false) {
                this.saveCheck = true;
                this.isLoading = true;
                console.log("condition 5");
                this.handleUpdate(event, this.currentNoteId, this.saveCheck);
                this.saveCheck = false;
                this.isLoading = false;
                this.allowChange = false;
            }
            if ((this.previousNoteId !== null && this.currentNoteId !== null) && (this.previousNoteId !== this.currentNoteId) && this.allowChange === true && !containerViewNote.contains(event.target) && this.insertedRecordId !== null && this.flag === true) {
                this.saveCheck = true;
                this.isLoading = true;
                console.log("condition 6");
                this.handleUpdate(event, this.insertedRecordId, this.saveCheck);
                this.saveCheck = false;
                this.isLoading = false;
                this.allowChange = false;
            }
            if (this.allowChange === true && (containerViewNote.contains(event.target)) && this.lastInsertedId !== null && this.showCreateNote === true) {
                this.saveCheck = true;
                this.isLoading = true;
                console.log("condition 7");
                this.handleUpdate(event, this.lastInsertedId, this.saveCheck);
                this.saveCheck = false;
                this.isLoading = false;
                this.lastInsertedId = null;
                this.allowChange = false;
            }
        }

    }
}