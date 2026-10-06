import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import React from 'react';
import { listYaujSaves } from '../../util/download';
import { findMapDate, formatYaujDate, getYaujDefaultRegion, useYaujExport, yaujBaseName } from '../../util/yauj-export';

interface YaujExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Dev only: asks for the region and the "data up to" date, then writes the .json and .svg into yauj/saves. */
export default function YaujExportDialog({ isOpen, onClose }: YaujExportDialogProps) {
    const exportYauj = useYaujExport();
    const [region, setRegion] = React.useState('');
    const [date, setDate] = React.useState('');
    const [existing, setExisting] = React.useState<string[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;
        // Defaults: the opened file's region and the date written on the map itself (else today).
        setRegion(getYaujDefaultRegion());
        setDate(findMapDate(window.graph) ?? formatYaujDate());
        listYaujSaves().then(files => setExisting(files.map(f => f.name)));
    }, [isOpen]);

    const isValid = /^[\w-]+$/.test(region) && /^\d{8}$/.test(date);
    const base = yaujBaseName(region, date);
    const willOverwrite = isValid && existing.includes(`${base}.json`);

    const handleSave = async () => {
        setIsSaving(true);
        await exportYauj(region, date);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>yauj export</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={3}>
                        <FormLabel>Region</FormLabel>
                        <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="PearlRiverDelta" />
                        <FormHelperText>Letters, digits, - and _ only.</FormHelperText>
                    </FormControl>
                    <FormControl mb={3}>
                        <FormLabel>Data up to (YYYYMMDD)</FormLabel>
                        <Input value={date} onChange={e => setDate(e.target.value)} placeholder="20260731" />
                        <FormHelperText>Defaults to the date written on the map.</FormHelperText>
                    </FormControl>
                    <Text fontSize="sm">
                        {isValid ? `yauj/saves/${base}.json + .svg (SVG 2.0)` : 'Enter a region and an 8-digit date.'}
                    </Text>
                    {willOverwrite && (
                        <Text fontSize="sm" color="orange.500">
                            A file with this name already exists and will be overwritten.
                        </Text>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={2} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="teal" onClick={handleSave} isDisabled={!isValid} isLoading={isSaving}>
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
